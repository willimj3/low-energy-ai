import { useState, useEffect } from 'react'
import './App.css'

/**
 * Low Energy AI Interface Demo
 *
 * This app demonstrates how users could set preferences to route their queries
 * to more efficient AI models, saving energy and money when maximum power isn't needed.
 *
 * The three sliders (Efficiency, Speed, Complexity) determine which model handles queries:
 * - High efficiency + low complexity → smaller, cheaper model (gpt-4o-mini)
 * - Low efficiency + high complexity → larger, more capable model (gpt-4o)
 */

// ============================================================================
// CONFIGURATION - Model definitions and pricing
// ============================================================================

// Model configurations with estimated costs per 1M tokens (December 2025 pricing)
// Using official OpenAI API model IDs from platform.openai.com/docs/models
// Organized from most efficient (lowest energy) to most powerful (highest energy)
const MODELS = {
  // Tier 1: Ultra Efficient - Bulk tasks, classification, lowest cost
  'gpt-4.1-nano': {
    id: 'gpt-4.1-nano',           // Official API ID
    name: 'GPT-4.1 Nano',
    description: 'Ultra-cheap, bulk labeling & classification',
    costPer1MTokens: 0.10,
    color: '#10b981',
    energyRating: '🌱 Minimal',
    tier: 1
  },
  // Tier 2: Very Efficient - Fast, everyday tasks
  'gpt-4.1-mini': {
    id: 'gpt-4.1-mini',           // Official API ID
    name: 'GPT-4.1 Mini',
    description: 'Fast, 1M context, great instruction following',
    costPer1MTokens: 0.40,
    color: '#22c55e',
    energyRating: '🌿 Low',
    tier: 2
  },
  // Tier 3: Efficient Reasoning - Fast reasoning for coding/math
  'o4-mini': {
    id: 'o4-mini',                // Official API ID
    name: 'o4-mini',
    description: 'Fast reasoning, excellent math & coding',
    costPer1MTokens: 0.60,
    color: '#84cc16',
    energyRating: '⚡ Medium',
    tier: 3
  },
  // Tier 4: Capable - Smart general model
  'gpt-4.1': {
    id: 'gpt-4.1',                // Official API ID
    name: 'GPT-4.1',
    description: 'Smart non-reasoning, 1M context, excellent coding',
    costPer1MTokens: 2.00,
    color: '#eab308',
    energyRating: '🔥 High',
    tier: 4
  },
  // Tier 5: Advanced - GPT-5 mini (successor to o4-mini)
  'gpt-5-mini': {
    id: 'gpt-5-mini',             // Official API ID
    name: 'GPT-5 Mini',
    description: 'Fast GPT-5, great for most tasks',
    costPer1MTokens: 0.80,
    color: '#f97316',
    energyRating: '🔥🔥 Very High',
    tier: 5
  },
  // Tier 6: Maximum Power - Latest flagship
  'gpt-5.2': {
    id: 'gpt-5.2',                // Official API ID
    name: 'GPT-5.2',
    description: 'Flagship: 400K context, thinking, coding, agentic',
    costPer1MTokens: 1.75,
    color: '#ef4444',
    energyRating: '🔥🔥🔥 Maximum',
    tier: 6
  }
}

// Estimated tokens per query (rough average for demo purposes)
const ESTIMATED_TOKENS_PER_QUERY = 500

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Model tiers ordered from most efficient to most powerful
const MODEL_TIERS = [
  'gpt-4.1-nano',  // Tier 1: Ultra efficient
  'gpt-4.1-mini',  // Tier 2: Very efficient
  'o4-mini',       // Tier 3: Efficient reasoning
  'gpt-4.1',       // Tier 4: Capable
  'gpt-5-mini',    // Tier 5: Advanced (GPT-5 mini)
  'gpt-5.2'        // Tier 6: Maximum power (latest flagship)
]

/**
 * Determines which model to use based on slider values.
 *
 * Logic:
 * - Complexity is the primary driver (higher complexity = more powerful model)
 * - Efficiency preference can push toward more efficient options
 * - Speed preference is considered but weighted less
 *
 * The "preference code" is calculated using prime numbers for each slider:
 * Efficiency=2, Speed=3, Complexity=5
 * This creates a unique code for each combination (for future extensibility)
 */
function selectModel(efficiency, speed, complexity) {
  // Calculate preference code using prime number system
  const preferenceCode = (efficiency * 2) + (speed * 3) + (complexity * 5)

  // Map complexity 1-5 to base tier 1-6
  // complexity 1 → tier 1, complexity 2 → tier 2, complexity 3 → tier 3-4,
  // complexity 4 → tier 4-5, complexity 5 → tier 5-6
  let baseTier = Math.ceil(complexity * 1.2)

  // High efficiency preference can reduce the tier (save energy)
  if (efficiency >= 4 && complexity <= 2) {
    baseTier = 1  // Use most efficient model
  } else if (efficiency >= 4 && complexity <= 3) {
    baseTier = Math.max(1, baseTier - 1)  // Step down one tier
  } else if (efficiency <= 2 && complexity >= 4) {
    baseTier = Math.min(6, baseTier + 1)  // User doesn't care about efficiency, step up
  }

  // Speed preference: high speed favors non-reasoning models (gpt-4.1 series)
  if (speed >= 4 && complexity <= 3) {
    baseTier = Math.min(baseTier, 3)  // Cap at tier 3 (gpt-4.1) for speed
  }

  // If user wants reasoning (complexity 4-5) but also speed, use o4-mini
  if (speed >= 4 && complexity >= 4) {
    baseTier = 4  // o4-mini is fast reasoning
  }

  // Clamp to valid range (1-6)
  const finalTier = Math.max(1, Math.min(6, baseTier))
  const modelId = MODEL_TIERS[finalTier - 1]

  return { model: MODELS[modelId], preferenceCode }
}

/**
 * Calculate estimated cost per query based on selected model
 * Cost is per 1M tokens, so divide by 1,000,000
 */
function calculateQueryCost(model) {
  return (model.costPer1MTokens * ESTIMATED_TOKENS_PER_QUERY / 1000000).toFixed(6)
}

/**
 * Get the most expensive model for comparison (gpt-4.1 at $2.00/1M)
 */
function getMaxModelCost() {
  return MODELS['gpt-4.1'].costPer1MTokens * ESTIMATED_TOKENS_PER_QUERY / 1000000
}

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * Slider component for preference settings
 */
function PreferenceSlider({ label, value, onChange, description, icon }) {
  return (
    <div className="slider-container">
      <div className="slider-header">
        <span className="slider-icon">{icon}</span>
        <label className="slider-label">{label}</label>
        <span className="slider-value">{value}</span>
      </div>
      <input
        type="range"
        min="1"
        max="5"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="slider"
      />
      <div className="slider-scale">
        <span>Low</span>
        <span>High</span>
      </div>
      <p className="slider-description">{description}</p>
    </div>
  )
}

/**
 * Model selector dropdown - allows direct model selection
 * When user picks a model, sliders adjust to match
 */
function ModelSelector({ currentModel, onModelSelect }) {
  return (
    <div className="model-selector">
      <label className="selector-label">Or pick a model directly:</label>
      <select
        value={currentModel.id}
        onChange={(e) => onModelSelect(e.target.value)}
        className="model-dropdown"
        style={{ borderColor: currentModel.color }}
      >
        {MODEL_TIERS.map(modelId => {
          const m = MODELS[modelId]
          return (
            <option key={modelId} value={modelId}>
              {m.name} - {m.description}
            </option>
          )
        })}
      </select>
    </div>
  )
}

/**
 * Model display card showing currently selected model
 */
function ModelDisplay({ model, preferenceCode }) {
  return (
    <div
      className="model-display"
      style={{
        borderColor: model.color,
        boxShadow: `0 0 20px ${model.color}33`
      }}
    >
      <div className="model-header">
        <span className="model-energy" style={{ color: model.color }}>
          {model.energyRating}
        </span>
      </div>
      <h2 className="model-name" style={{ color: model.color }}>
        {model.name}
      </h2>
      <p className="model-description">{model.description}</p>
      <div className="preference-code">
        Preference Code: <code>{preferenceCode}</code>
      </div>
    </div>
  )
}

/**
 * Savings display showing cost estimates
 */
function SavingsDisplay({ model, queryCount, totalSavings }) {
  const queryCost = calculateQueryCost(model)

  // Determine efficiency color based on model tier
  const isEfficient = model.tier <= 2
  const statusColor = model.color

  // Efficiency message based on tier
  const getEfficiencyMessage = () => {
    switch (model.tier) {
      case 1: return "✓ Ultra efficient! Lowest cost"
      case 2: return "✓ Very efficient!"
      case 3: return "✓ Good balance"
      case 4: return "→ Reasoning mode (efficient)"
      case 5: return "↑ Advanced reasoning"
      case 6: return "⚠ Maximum power mode"
      default: return ""
    }
  }

  return (
    <div className="savings-display" style={{ borderColor: statusColor }}>
      <h3>Cost Estimates</h3>
      <div className="savings-row">
        <span>Cost per query:</span>
        <span className="savings-value">${queryCost}</span>
      </div>
      <div className="savings-row">
        <span>Queries this session:</span>
        <span className="savings-value">{queryCount}</span>
      </div>
      <div className="savings-row highlight" style={{ color: '#22c55e' }}>
        <span>Session savings:</span>
        <span className="savings-value">${totalSavings.toFixed(4)}</span>
      </div>
      <p className="savings-note" style={{ color: statusColor }}>
        {getEfficiencyMessage()}
      </p>
    </div>
  )
}

/**
 * Chat message component
 */
function ChatMessage({ message, isUser }) {
  return (
    <div className={`chat-message ${isUser ? 'user' : 'assistant'}`}>
      <div className="message-content">
        {message}
      </div>
    </div>
  )
}

/**
 * Chat interface component
 */
function ChatInterface({ model, onQuerySent, onClearChat, messages, setMessages }) {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { text: userMessage, isUser: true }])
    setIsLoading(true)
    setError(null)

    try {
      // Build request body - newer models (gpt-5.x, o-series) use max_completion_tokens
      const isNewerModel = model.id.startsWith('gpt-5') || model.id.startsWith('o')
      const requestBody = {
        model: model.id,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant. Keep responses concise but informative.'
          },
          ...messages.map(m => ({
            role: m.isUser ? 'user' : 'assistant',
            content: m.text
          })),
          { role: 'user', content: userMessage }
        ]
      }

      // Use appropriate token limit parameter based on model
      if (isNewerModel) {
        requestBody.max_completion_tokens = 500
      } else {
        requestBody.max_tokens = 500
      }

      // Call the OpenAI API with the selected model
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || `API error: ${response.status}`)
      }

      const data = await response.json()
      const assistantMessage = data.choices[0].message.content

      setMessages(prev => [...prev, { text: assistantMessage, isUser: false }])
      onQuerySent(model)  // Pass the model used for savings calculation

    } catch (err) {
      setError(err.message)
      console.error('API Error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <h3>Chat with {model.name}</h3>
        <div className="chat-header-actions">
          <span className="model-badge" style={{ backgroundColor: model.color }}>
            {model.id}
          </span>
          {messages.length > 0 && (
            <button
              className="clear-chat-btn"
              onClick={onClearChat}
              title="Clear chat"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-placeholder">
            Send a message to test the {model.name} model
          </div>
        )}
        {messages.map((msg, idx) => (
          <ChatMessage key={idx} message={msg.text} isUser={msg.isUser} />
        ))}
        {isLoading && (
          <div className="chat-message assistant">
            <div className="message-content loading">
              Thinking...
            </div>
          </div>
        )}
        {error && (
          <div className="chat-error">
            Error: {error}
            <br />
            <small>Make sure VITE_OPENAI_API_KEY is set in your .env file</small>
          </div>
        )}
      </div>

      <div className="chat-input-container">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          className="chat-input"
          disabled={isLoading}
        />
        <button
          onClick={sendMessage}
          disabled={isLoading || !input.trim()}
          className="send-button"
          style={{ backgroundColor: model.color }}
        >
          Send
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN APP
// ============================================================================

function App() {
  // Slider states (1-5 scale)
  const [efficiency, setEfficiency] = useState(3)
  const [speed, setSpeed] = useState(3)
  const [complexity, setComplexity] = useState(3)

  // Chat messages (lifted up so we can reset from parent)
  const [messages, setMessages] = useState([])

  // Query tracking for savings calculation
  const [queryCount, setQueryCount] = useState(0)
  const [totalSavings, setTotalSavings] = useState(0)

  // Determine current model based on slider values
  const { model, preferenceCode } = selectModel(efficiency, speed, complexity)

  /**
   * Reset everything to defaults
   */
  const handleReset = () => {
    setEfficiency(3)
    setSpeed(3)
    setComplexity(3)
    setMessages([])
    setQueryCount(0)
    setTotalSavings(0)
  }

  /**
   * Clear just the chat
   */
  const handleClearChat = () => {
    setMessages([])
  }

  /**
   * When user picks a model directly from dropdown,
   * adjust sliders to values that would produce that model
   */
  const handleModelSelect = (modelId) => {
    const tier = MODEL_TIERS.indexOf(modelId) + 1

    // Set sliders to values that would select this tier
    // These are "suggested" slider positions for each model
    const sliderPresets = {
      'gpt-4.1-nano': { efficiency: 5, speed: 5, complexity: 1 },
      'gpt-4.1-mini': { efficiency: 4, speed: 4, complexity: 2 },
      'o4-mini':      { efficiency: 3, speed: 5, complexity: 4 },  // Fast reasoning
      'gpt-4.1':      { efficiency: 2, speed: 3, complexity: 3 },
      'gpt-5-mini':   { efficiency: 2, speed: 3, complexity: 4 },
      'gpt-5.2':      { efficiency: 1, speed: 2, complexity: 5 },
    }

    const preset = sliderPresets[modelId]
    if (preset) {
      setEfficiency(preset.efficiency)
      setSpeed(preset.speed)
      setComplexity(preset.complexity)
    }
  }

  // Background color based on model tier
  const getBgColor = () => {
    const colors = {
      1: 'rgba(16, 185, 129, 0.08)',  // Emerald
      2: 'rgba(34, 197, 94, 0.08)',   // Green
      3: 'rgba(132, 204, 22, 0.08)',  // Lime
      4: 'rgba(234, 179, 8, 0.08)',   // Yellow
      5: 'rgba(249, 115, 22, 0.08)',  // Orange
      6: 'rgba(239, 68, 68, 0.08)'    // Red
    }
    return colors[model.tier] || colors[3]
  }

  // Handle query sent from chat - calculate actual savings vs gpt-4o (most expensive)
  const handleQuerySent = (modelUsed) => {
    setQueryCount(prev => prev + 1)
    // Calculate savings compared to using gpt-4o for this query
    const maxCost = getMaxModelCost()
    const actualCost = modelUsed.costPer1MTokens * ESTIMATED_TOKENS_PER_QUERY / 1000000
    const saved = maxCost - actualCost
    setTotalSavings(prev => prev + saved)
  }

  // Toggle for showing/hiding the guide
  const [showGuide, setShowGuide] = useState(true)

  return (
    <div className="app" style={{ backgroundColor: getBgColor() }}>
      <header className="app-header">
        <h1>Low Energy AI Interface</h1>
        <p className="subtitle">
          Route queries to the right model based on your needs
        </p>
      </header>

      {/* Collapsible Guide Section */}
      {showGuide && (
        <section className="guide-section">
          <button
            className="guide-close"
            onClick={() => setShowGuide(false)}
            aria-label="Close guide"
          >
            ×
          </button>
          <h2>How It Works</h2>
          <div className="guide-content">
            <div className="guide-step">
              <div className="step-number">1</div>
              <div className="step-text">
                <strong>Set your preferences</strong> using the three sliders, or pick a model directly from the dropdown.
              </div>
            </div>
            <div className="guide-step">
              <div className="step-number">2</div>
              <div className="step-text">
                <strong>Efficiency</strong> — How much do you want to save energy/cost? Higher = greener, cheaper models.
              </div>
            </div>
            <div className="guide-step">
              <div className="step-number">3</div>
              <div className="step-text">
                <strong>Speed</strong> — Need fast responses? Higher = prioritizes low-latency models.
              </div>
            </div>
            <div className="guide-step">
              <div className="step-number">4</div>
              <div className="step-text">
                <strong>Complexity</strong> — How hard is your task? Higher = more powerful reasoning models.
              </div>
            </div>
            <div className="guide-step">
              <div className="step-number">5</div>
              <div className="step-text">
                <strong>Chat</strong> with the selected model and see your estimated savings in real-time.
              </div>
            </div>
          </div>
          <p className="guide-note">
            The background color reflects your current model: <span style={{color: '#10b981'}}>green</span> = efficient, <span style={{color: '#ef4444'}}>red</span> = maximum power.
          </p>
        </section>
      )}

      {!showGuide && (
        <button className="guide-show" onClick={() => setShowGuide(true)}>
          Show Guide
        </button>
      )}

      <main className="app-main">
        {/* Left Panel: Sliders */}
        <section className="preferences-panel">
          <h2>Your Preferences</h2>

          <PreferenceSlider
            label="Efficiency"
            value={efficiency}
            onChange={setEfficiency}
            icon="🌱"
            description="How much do you prioritize energy/cost savings?"
          />

          <PreferenceSlider
            label="Speed"
            value={speed}
            onChange={setSpeed}
            icon="⚡"
            description="How important is response speed?"
          />

          <PreferenceSlider
            label="Complexity"
            value={complexity}
            onChange={setComplexity}
            icon="🧠"
            description="How complex are your queries?"
          />

          <ModelSelector
            currentModel={model}
            onModelSelect={handleModelSelect}
          />

          <ModelDisplay model={model} preferenceCode={preferenceCode} />

          <SavingsDisplay
            model={model}
            queryCount={queryCount}
            totalSavings={totalSavings}
          />
        </section>

        {/* Right Panel: Chat */}
        <section className="chat-panel">
          <ChatInterface
            model={model}
            onQuerySent={handleQuerySent}
            onClearChat={handleClearChat}
            messages={messages}
            setMessages={setMessages}
          />
        </section>
      </main>

      <footer className="app-footer">
        <button className="reset-btn" onClick={handleReset}>
          Reset All
        </button>
        <p>
          Demo prototype showing energy-conscious AI model selection.
          Actual energy/cost savings would vary in production.
        </p>
      </footer>
    </div>
  )
}

export default App
