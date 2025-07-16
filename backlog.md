# Polycom SoundStructure Module Development Backlog

This document outlines the complete feature roadmap for achieving full feature parity with the SoundStructure command protocol and replacing manual TCP control.

## Current Implementation Status

**Completed Features (40% coverage):**
- ✅ Basic channel mute/unmute (`set/tog mute`)
- ✅ Channel fader control (`set/inc/dec fader`)
- ✅ Mic input gain control (`set/inc/dec mic_in_gain`)
- ✅ Basic matrix crosspoint mute (`set/tog matrix_mute`)
- ✅ Preset recall (`run preset`)
- ✅ Timer-based discovery with `vclist`/`vcglist`
- ✅ Event-driven state updates for mute/fader
- ✅ Variable definitions (but values not populated)
- ✅ Basic feedbacks (but not reliable enough for production)

---

## Phase 1: Critical Bug Fixes & Core Stability (Immediate Priority)

### 1.1 Fix Variable Initialization Bug
**Problem:** Variables are defined but never populated with actual values during discovery.

**Implementation:**
```javascript
// In main.js finalizeDiscovery(), after sending get commands, ensure responses populate variables
finalizeDiscovery() {
    // ... existing code ...
    
    // Add variable initialization tracking
    this.variableInitialization = {
        expected: 0,
        received: 0,
        timeout: setTimeout(() => this.completeVariableInit(), 2000)
    }
    
    channels.forEach((channel) => {
        if (channel.pctype !== 'control') {
            this.variableInitialization.expected += 2 // mute + gain
            this.sendCommand(`get mute "${channel.label}"`)
            this.sendCommand(`get fader "${channel.label}"`)
        }
    })
}

// In processLine(), ensure val responses update variables
processLine(line) {
    // ... existing code ...
    
    if (line.startsWith('val mute')) {
        const match = /val mute "([^"]+)" = (\d)/.exec(line)
        if (match) {
            const channel = this.state.virtualChannels[match[1]]
            if (channel) {
                channel.mute = parseInt(match[2])
                this.setVariableValues({ [`mute_${sanitize(channel.label)}`]: channel.mute })
                this.checkFeedbacks('channel_muted')
                this.trackVariableInit()
            }
        }
    }
    // Similar for fader, matrix_mute, etc.
}
```

### 1.2 Enhance Feedback Reliability
**Problem:** Users manually set button colors because feedbacks aren't reliable enough.

**Implementation:**
```javascript
// In feedbacks.js - add more robust feedback options
feedbacks.channel_muted = {
    type: 'boolean',
    name: 'Channel is Muted',
    description: 'If the selected channel is muted, change the style of the button.',
    options: [
        { type: 'dropdown', id: 'channel', label: 'Channel', choices: getChoices(self, 'channel') },
        { type: 'checkbox', id: 'invert', label: 'Invert (show when unmuted)', default: false }
    ],
    defaultStyle: {
        color: combineRgb(255, 255, 255),
        bgcolor: combineRgb(255, 0, 0),
    },
    callback: (feedback) => {
        const channel = self.state.virtualChannels[feedback.options.channel]
        if (!channel) return false
        const isMuted = channel.mute === 1
        return feedback.options.invert ? !isMuted : isMuted
    },
}

// Add gain-based feedbacks
feedbacks.channel_gain_threshold = {
    type: 'boolean',
    name: 'Channel Gain Above/Below Threshold',
    options: [
        { type: 'dropdown', id: 'channel', label: 'Channel', choices: getChoices(self, 'channel') },
        { type: 'dropdown', id: 'comparison', label: 'Comparison', choices: [
            { id: 'above', label: 'Above' },
            { id: 'below', label: 'Below' },
            { id: 'equal', label: 'Equal to' }
        ]},
        { type: 'number', id: 'threshold', label: 'Threshold (dB)', default: 0, min: -100, max: 20 }
    ],
    callback: (feedback) => {
        const channel = self.state.virtualChannels[feedback.options.channel]
        if (!channel || typeof channel.gain !== 'number') return false
        
        switch (feedback.options.comparison) {
            case 'above': return channel.gain > feedback.options.threshold
            case 'below': return channel.gain < feedback.options.threshold
            case 'equal': return Math.abs(channel.gain - feedback.options.threshold) < 0.1
            default: return false
        }
    }
}
```

### 1.3 Discovery Progress & Error Handling
**Implementation:**
```javascript
// Enhanced discovery with progress tracking
startDiscovery() {
    this.discoveryStats = {
        phase: 'starting',
        vcItems: 0,
        vcgItems: 0,
        presets: [],
        startTime: Date.now(),
        errors: []
    }
    
    this.updateStatus(InstanceStatus.Connecting, 'Discovering device configuration...')
    this.sendCommand('vclist')
    this.sendCommand('vcglist') 
    this.sendCommand('get presets')
    this.sendCommand('get version')
    
    this.discoveryTimer = setTimeout(() => this.checkDiscoveryProgress(), 1000)
}

checkDiscoveryProgress() {
    const elapsed = Date.now() - this.discoveryStats.startTime
    
    if (this.discoveryStats.vcItems === 0 && elapsed > 5000) {
        this.log('warn', 'No channels discovered after 5s, retrying...')
        this.retryDiscovery()
    } else if (this.discoveryStats.vcItems > 0 && elapsed > 3000) {
        this.finalizeDiscovery()
    } else {
        this.discoveryTimer = setTimeout(() => this.checkDiscoveryProgress(), 1000)
    }
}
```

---

## Phase 2: Core Feature Expansion (High Priority)

### 2.1 Complete Matrix Controls
**Missing:** Matrix gain, balance, gate, invert controls

**Implementation:**
```javascript
// In actions.js - extend matrix controls
actions.matrix_gain = {
    name: 'Set/Adjust Matrix Crosspoint Gain',
    options: [
        { type: 'dropdown', id: 'input', label: 'Input', choices: getChoices(self, 'all') },
        { type: 'dropdown', id: 'output', label: 'Output', choices: getChoices(self, 'all') },
        { type: 'dropdown', id: 'mode', label: 'Mode', choices: ['set', 'inc', 'dec'], default: 'set' },
        { type: 'number', id: 'value', label: 'Value (dB)', default: 0, min: -100, max: 20, step: 0.1 }
    ],
    callback: ({ options }) => {
        if (options.input === 'none' || options.output === 'none') return
        self.sendCommand(`${options.mode} matrix_gain "${options.input}" "${options.output}" ${options.value}`)
    }
}

actions.matrix_balance = {
    name: 'Set Matrix Crosspoint Balance',
    options: [
        { type: 'dropdown', id: 'input', label: 'Input', choices: getChoices(self, 'all') },
        { type: 'dropdown', id: 'output', label: 'Output', choices: getChoices(self, 'all') },
        { type: 'number', id: 'balance', label: 'Balance (-1.0 to 1.0)', default: 0, min: -1, max: 1, step: 0.01 }
    ],
    callback: ({ options }) => {
        self.sendCommand(`set matrix_balance "${options.input}" "${options.output}" ${options.balance}`)
    }
}
```

### 2.2 Line Output Gain Control
**Implementation:**
```javascript
actions.line_out_gain = {
    name: 'Set/Adjust Line Output Gain',
    options: [
        { type: 'dropdown', id: 'channel', label: 'Line Output', choices: getChoices(self, 'line_out') },
        { type: 'dropdown', id: 'mode', label: 'Mode', choices: ['set', 'inc', 'dec'], default: 'set' },
        { type: 'number', id: 'value', label: 'Value (dB)', default: 0, min: -100, max: 20, step: 0.5 }
    ],
    callback: ({ options }) => {
        if (options.channel === 'none') return
        self.sendCommand(`${options.mode} line_out_gain "${options.channel}" ${options.value}`)
    }
}
```

### 2.3 System Safety Controls
**Implementation:**
```javascript
// Global safety mute (emergency mute all outputs)
actions.safety_mute = {
    name: 'Set/Toggle Safety Mute (Emergency Mute All)',
    options: [
        { type: 'dropdown', id: 'mute', label: 'Safety Mute', choices: [
            { id: '1', label: 'Enable (Mute All)' },
            { id: '0', label: 'Disable' },
            { id: 'tog', label: 'Toggle' }
        ], default: 'tog' }
    ],
    callback: ({ options }) => {
        const cmd = options.mute === 'tog' ? 'tog' : 'set'
        const value = options.mute === 'tog' ? '' : ` ${options.mute}`
        self.sendCommand(`${cmd} safety_mute${value}`)
    }
}

actions.sys_reboot = {
    name: 'Reboot System',
    options: [
        { type: 'static-text', id: 'warning', width: 12, label: 'Warning', 
          value: 'This will reboot the entire SoundStructure system!' }
    ],
    callback: () => {
        self.sendCommand('set sys_reboot')
    }
}
```

### 2.4 Basic Telephony Controls
**Implementation:**
```javascript
// Get telephony channels during discovery
function getTelephonyChannels(self) {
    return Object.values(self.state.virtualChannels)
        .filter(c => c.pctype.includes('pstn') || c.pctype.includes('voip'))
        .map(c => ({ id: c.label, label: `${c.label} (${c.pctype})` }))
}

actions.phone_dial = {
    name: 'Phone Dial Number',
    options: [
        { type: 'dropdown', id: 'channel', label: 'Phone Channel', choices: getTelephonyChannels(self) },
        { type: 'textinput', id: 'number', label: 'Phone Number', regex: '/^[0-9+*#,]+$/' }
    ],
    callback: ({ options }) => {
        if (options.channel && options.number) {
            self.sendCommand(`set phone_dial "${options.channel}" "${options.number}"`)
        }
    }
}

actions.phone_connect = {
    name: 'Phone Connect/Disconnect',
    options: [
        { type: 'dropdown', id: 'channel', label: 'Phone Channel', choices: getTelephonyChannels(self) },
        { type: 'dropdown', id: 'action', label: 'Action', choices: [
            { id: '1', label: 'Connect/Answer' },
            { id: '0', label: 'Disconnect/Hangup' },
            { id: 'tog', label: 'Toggle' }
        ]}
    ],
    callback: ({ options }) => {
        const cmd = options.action === 'tog' ? 'tog' : 'set'
        const value = options.action === 'tog' ? '' : ` ${options.action}`
        self.sendCommand(`${cmd} phone_connect "${options.channel}"${value}`)
    }
}
```

---

## Phase 3: Audio Processing Controls (Medium Priority)

### 3.1 Equalizer Controls
**Implementation Strategy:** Dynamic action generation based on discovered channel capabilities.

```javascript
// EQ actions generated per channel that supports EQ
function generateEQActions(self) {
    const actions = {}
    const eqChannels = Object.values(self.state.virtualChannels)
        .filter(c => c.pctype.includes('mic_in') || c.pctype.includes('line_out'))
    
    // Parametric EQ Band Control
    actions.peq_band = {
        name: 'Parametric EQ Band Control',
        options: [
            { type: 'dropdown', id: 'channel', label: 'Channel', 
              choices: eqChannels.map(c => ({ id: c.label, label: c.label })) },
            { type: 'dropdown', id: 'band', label: 'Band', 
              choices: Array.from({length: 10}, (_, i) => ({ id: i+1, label: `Band ${i+1}` })) },
            { type: 'dropdown', id: 'parameter', label: 'Parameter', choices: [
                { id: 'peq_band_en', label: 'Enable/Disable' },
                { id: 'peq_gain', label: 'Gain (dB)' },
                { id: 'peq_frequency', label: 'Frequency (Hz)' },
                { id: 'peq_bandwidth', label: 'Bandwidth' }
            ]},
            { type: 'number', id: 'value', label: 'Value', default: 0 }
        ],
        callback: ({ options }) => {
            self.sendCommand(`set ${options.parameter} "${options.channel}" ${options.band} ${options.value}`)
        }
    }
    
    return actions
}
```

### 3.2 Dynamics Processing
**Implementation:**
```javascript
actions.dynamics_control = {
    name: 'Dynamics Processing Control',
    options: [
        { type: 'dropdown', id: 'channel', label: 'Channel', choices: getChoices(self, 'channel') },
        { type: 'dropdown', id: 'processor', label: 'Processor', choices: [
            { id: 'comp', label: 'Compressor' },
            { id: 'gate', label: 'Gate' },
            { id: 'lim', label: 'Limiter' },
            { id: 'exp', label: 'Expander' }
        ]},
        { type: 'dropdown', id: 'parameter', label: 'Parameter', choices: [
            { id: 'en', label: 'Enable/Disable' },
            { id: 'thresh', label: 'Threshold (dB)' },
            { id: 'ratio', label: 'Ratio' },
            { id: 'attack', label: 'Attack (ms)' },
            { id: 'decay', label: 'Decay (ms)' }
        ]},
        { type: 'number', id: 'value', label: 'Value' }
    ],
    callback: ({ options }) => {
        const param = `dp_${options.processor}_${options.parameter}`
        self.sendCommand(`set ${param} "${options.channel}" ${options.value}`)
    }
}
```

### 3.3 Filter Controls
**Implementation:**
```javascript
actions.filter_control = {
    name: 'Filter Control (HPF/LPF/Shelving)',
    options: [
        { type: 'dropdown', id: 'channel', label: 'Channel', choices: getChoices(self, 'channel') },
        { type: 'dropdown', id: 'filter', label: 'Filter Type', choices: [
            { id: 'hpf', label: 'High Pass Filter' },
            { id: 'lpf', label: 'Low Pass Filter' },
            { id: 'high_shelf', label: 'High Shelf' },
            { id: 'low_shelf', label: 'Low Shelf' }
        ]},
        { type: 'dropdown', id: 'parameter', label: 'Parameter', choices: [
            { id: 'en', label: 'Enable/Disable' },
            { id: 'frequency', label: 'Frequency (Hz)' },
            { id: 'gain', label: 'Gain (dB)' },
            { id: 'order', label: 'Order' }
        ]},
        { type: 'number', id: 'value', label: 'Value' }
    ],
    callback: ({ options }) => {
        const param = `${options.filter}_${options.parameter}`
        self.sendCommand(`set ${param} "${options.channel}" ${options.value}`)
    }
}
```

---

## Phase 4: Advanced Telephony (Medium Priority)

### 4.1 VoIP Advanced Controls
**Implementation:**
```javascript
// VoIP-specific actions for advanced call handling
actions.voip_hold = {
    name: 'VoIP Hold/Resume Call',
    options: [
        { type: 'dropdown', id: 'channel', label: 'VoIP Channel', 
          choices: () => getVoIPChannels(self) },
        { type: 'dropdown', id: 'action', label: 'Action', choices: [
            { id: 'hold', label: 'Hold' },
            { id: 'resume', label: 'Resume' }
        ]}
    ],
    callback: ({ options }) => {
        self.sendCommand(`set voip_${options.action} "${options.channel}"`)
    }
}

actions.voip_transfer = {
    name: 'VoIP Transfer Call',
    options: [
        { type: 'dropdown', id: 'channel', label: 'VoIP Channel', choices: () => getVoIPChannels(self) },
        { type: 'textinput', id: 'target', label: 'Transfer Target' },
        { type: 'checkbox', id: 'blind', label: 'Blind Transfer', default: false }
    ],
    callback: ({ options }) => {
        if (options.blind) {
            self.sendCommand(`set voip_blind "${options.channel}"`)
        }
        self.sendCommand(`set voip_transfer "${options.channel}" "${options.target}"`)
    }
}
```

### 4.2 Call Status Variables and Feedbacks
**Implementation:**
```javascript
// In variables.js - add telephony variables
telephonyChannels.forEach(channel => {
    variables.push({
        variableId: `call_status_${sanitize(channel.label)}`,
        name: `Call status for ${channel.label}`
    })
    variables.push({
        variableId: `phone_ring_${sanitize(channel.label)}`,
        name: `Ring status for ${channel.label}`
    })
})

// In feedbacks.js - call status feedback
feedbacks.call_active = {
    type: 'boolean',
    name: 'Call is Active',
    options: [
        { type: 'dropdown', id: 'channel', label: 'Phone Channel', choices: getTelephonyChannels(self) }
    ],
    defaultStyle: {
        color: combineRgb(255, 255, 255),
        bgcolor: combineRgb(0, 255, 0)
    },
    callback: (feedback) => {
        const channel = self.state.virtualChannels[feedback.options.channel]
        return channel && channel.phone_connect === 1
    }
}
```

---

## Phase 5: System Monitoring & Advanced Features (Low Priority)

### 5.1 System Status Variables
**Implementation:**
```javascript
// System health monitoring
actions.get_system_status = {
    name: 'Update System Status',
    callback: () => {
        self.sendCommand('get dev_status')
        self.sendCommand('get dev_temp 1')
        self.sendCommand('get dev_temp 2') 
        self.sendCommand('get dev_temp 3')
        self.sendCommand('get dev_firmware_ver')
        self.sendCommand('get sys_name')
    }
}

// Variables for system monitoring
const systemVariables = [
    { variableId: 'device_status', name: 'Device Status (ok/warning/error)' },
    { variableId: 'device_temp_1', name: 'Device Temperature Sensor 1 (°C)' },
    { variableId: 'device_temp_2', name: 'Device Temperature Sensor 2 (°C)' },
    { variableId: 'device_temp_3', name: 'Device Temperature Sensor 3 (°C)' },
    { variableId: 'firmware_version', name: 'Firmware Version' },
    { variableId: 'system_name', name: 'System Name' }
]
```

### 5.2 Preset Management
**Implementation:**
```javascript
// Enhanced preset handling with discovery
startDiscovery() {
    // ... existing code ...
    this.sendCommand('get presets')
}

processLine(line) {
    // ... existing code ...
    if (line.startsWith('val presets')) {
        // Parse preset list response
        const presets = this.parsePresetList(line)
        this.state.presets = presets
        this.updatePresetActions()
    }
}

actions.save_preset = {
    name: 'Save Current Settings to Preset',
    options: [
        { type: 'textinput', id: 'name', label: 'Preset Name', required: true },
        { type: 'dropdown', id: 'type', label: 'Preset Type', choices: [
            { id: 'full', label: 'Full Preset' },
            { id: 'partial', label: 'Partial Preset' }
        ]}
    ],
    callback: ({ options }) => {
        self.sendCommand(`save preset_${options.type} "${options.name}"`)
    }
}
```

### 5.3 GPIO Control
**Implementation:**
```javascript
// GPIO control for external devices
actions.gpio_control = {
    name: 'GPIO Pin Control',
    options: [
        { type: 'dropdown', id: 'type', label: 'GPIO Type', choices: [
            { id: 'digital', label: 'Digital GPIO' },
            { id: 'analog', label: 'Analog GPIO' }
        ]},
        { type: 'number', id: 'pin', label: 'Pin Number', min: 1, max: 32 },
        { type: 'number', id: 'value', label: 'Value' }
    ],
    callback: ({ options }) => {
        const param = options.type === 'digital' ? 'digital_gpio_state' : 'analog_gpio_value'
        self.sendCommand(`set ${param} "GPIO" ${options.pin} ${options.value}`)
    }
}
```

---

## Implementation Research & Technical Notes

### Discovery Enhancement Strategy
- **Response Counting:** Track expected vs received responses
- **Timeout Handling:** Progressive timeouts (2s → 5s → 10s) with retry logic
- **State Validation:** Verify all discovered channels have required parameters
- **User Feedback:** Progress indication during discovery process

### Variable Population Fix
- **Root Cause:** `processLine()` updates `this.state` but doesn't call `setVariableValues()`
- **Solution:** Every `val` response must update both state and variables
- **Verification:** Add variable initialization tracking with completion callback

### Feedback Reliability  
- **Issue:** Race conditions between state updates and feedback evaluation
- **Solution:** Ensure `checkFeedbacks()` called after every state change
- **Enhancement:** Add feedback-specific debugging and validation

### Command Protocol Compliance
- **Termination:** Always use `\r\n` for commands, expect `\r` responses
- **Quoting:** Channel names with spaces must be quoted: `"Channel Name"`
- **Error Handling:** Parse `error "message"` responses and display to user
- **Event Sources:** Parameters marked as "Event Source: Yes" send spontaneous updates

### Performance Considerations
- **Command Queue:** 50ms delay prevents overwhelming device
- **Selective Updates:** Only poll non-event-driven parameters
- **State Management:** Maintain single source of truth in `this.state`
- **Memory Usage:** Clean up old discovery data on reconnection

This backlog provides a complete roadmap for achieving 100% feature parity with manual TCP control while adding the benefits of proper Companion integration (variables, feedbacks, dynamic discovery).