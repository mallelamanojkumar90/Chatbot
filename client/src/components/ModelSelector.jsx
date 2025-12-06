import React from 'react'

export default function ModelSelector({ selectedModel, onModelChange, models }) {
  return (
    <div className="model-selector">
      <label htmlFor="model-select">Model:</label>
      <select 
        id="model-select"
        value={selectedModel} 
        onChange={(e) => onModelChange(e.target.value)}
        className="model-dropdown"
      >
        {models.map((model) => (
          <option key={model.id} value={model.id}>
            {model.name} - {model.id} ({model.provider})
          </option>
        ))}
      </select>
    </div>
  )
}
