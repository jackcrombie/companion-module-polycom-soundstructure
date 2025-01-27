const { InstanceBase, Regex, runEntrypoint, InstanceStatus, TCPHelper } = require('@companion-module/base')
const UpgradeScripts = require('./upgrades')
const UpdateActions = require('./actions')
const UpdateFeedbacks = require('./feedbacks')
const UpdateVariableDefinitions = require('./variables')

class ModuleInstance extends InstanceBase {
	constructor(internal) {
		super(internal)

		// Basic properties
		this.socket = null
		this.buffer = ''

		// State tracking
		this.virtualChannels = []
		this.presets = []
		this.channelMuteStatus = {}
		this.crosspointMuteStatus = {}
		this.filterStatus = {}

		// Discovery related properties
		this.channels = {
			virtual: [],
			inputs: [], 
			outputs: [],
			mics: [],
			groups: []
		}
		this.channelTypes = {} // Maps channel names to their types
		this.discoveryInProgress = false
		this.discoveryTimeout = null
	}

	async init(config) {
		this.config = config
		this.updateStatus(InstanceStatus.Ok)
		this.connectToDevice()
		this.updateActions()
		this.updateFeedbacks()
		this.updateVariableDefinitions()
	}

	async destroy() {
		if (this.socket) {
			this.socket.destroy()
			this.socket = null
		}
	}

	async configUpdated(config) {
		this.config = config
		this.connectToDevice()
	}

	getConfigFields() {
		return [
			{
				type: 'textinput',
				id: 'host',
				label: 'SoundStructure IP',
				width: 8,
				regex: Regex.IP,
			},
			{
				type: 'textinput',
				id: 'port',
				label: 'Port',
				width: 4,
				default: '52774',
				regex: Regex.PORT,
			},
		]
	}

	updateActions() {
		UpdateActions(this)
	}

	updateFeedbacks() {
		UpdateFeedbacks(this)
	}

	updateVariableDefinitions() {
		UpdateVariableDefinitions(this)
	}

	connectToDevice() {
		if (this.socket) {
			this.socket.destroy()
			this.socket = null
		}

		if (this.config.host && this.config.port) {
			this.socket = new TCPHelper(this.config.host, this.config.port)

			this.socket.on('connect', () => {
				this.updateStatus(InstanceStatus.Ok)
				this.log('info', `Connected to SoundStructure at ${this.config.host}:${this.config.port}`)
				this.discoverChannels() // Start discovery on connection
			})

			this.socket.on('data', (data) => {
				this.buffer += data.toString()
				let newlineIndex
				while ((newlineIndex = this.buffer.indexOf('\r\n')) !== -1) {
					const line = this.buffer.substring(0, newlineIndex)
					this.processDeviceData(line)
					this.buffer = this.buffer.substring(newlineIndex + 2)
				}
			})

			this.socket.on('error', (err) => {
				this.updateStatus(InstanceStatus.Error, err.message)
				this.log('error', `Connection error: ${err.message}`)
			})

			this.socket.on('close', () => {
				this.updateStatus(InstanceStatus.Disconnected)
				this.log('debug', 'Connection closed')
			})
		}
	}

	async discoverChannels() {
		if (this.discoveryInProgress) {
			this.log('debug', 'Discovery already in progress')
			return
		}

		this.discoveryInProgress = true
		this.log('debug', '=== Starting Channel Discovery ===')

		this.channels = {
			virtual: [],
			inputs: [], 
			outputs: [],
			mics: [],
			groups: []
		}
		this.channelTypes = {}

		// Set a timeout for discovery
		this.discoveryTimeout = setTimeout(() => {
			if (this.discoveryInProgress) {
				this.discoveryInProgress = false
				this.log('warn', 'Channel discovery timed out. Current state:', JSON.stringify(this.channels))
				this.log('debug', '=== Discovery Timed Out ===')
				this.finalizeDiscovery()
			}
		}, 30000) // 30 second timeout

		// Query commands with delays
		setTimeout(() => {
			this.log('debug', 'Querying system info')
			this.sendCommand('get channels')
		}, 1000)

		setTimeout(() => {
			this.log('debug', 'Querying virtual channels')
			this.sendCommand('get virtual_channels')
		}, 2000)
	}

	processDeviceData(data) {
		this.log('debug', `Raw data received: ${data}`)

		// Handle discovery responses
		if (this.discoveryInProgress) {
			this.log('debug', `Processing discovery data: ${data}`)

			// Check for virtual channels response
			if (data.substring(0,18) === 'val virtual_channels') {
				const match = /val virtual_channels "(.+)"/.exec(data)
				if (match) {
					this.channels.virtual = match[1].split(',').map(c => c.trim())
					this.log('debug', 'Found virtual channels:', this.channels.virtual)
				}
			}
			
			// Check for channels response
			if (data.substring(0,11) === 'val channels') {
				const match = /val channels "(.+)"/.exec(data)
				if (match) {
					const channels = match[1].split(',').map(c => c.trim())
					this.log('debug', 'Found channels:', channels)
					
					// Sort channels into types
					channels.forEach(channel => {
						if (channel.toLowerCase().indexOf('mic') !== -1) {
							this.channels.mics.push(channel)
						} else {
							this.channels.inputs.push(channel)
						}
					})
				}
			}

			// Check if discovery is complete
			if (this.checkDiscoveryComplete()) {
				this.finalizeDiscovery()
				this.log('debug', '=== Discovery Complete ===')
				this.log('debug', 'Final channel state:', JSON.stringify(this.channels, null, 2))
			}
		}

		// Process all val responses
		if (data.substring(0,4) === 'val ') {
			const match = /val "(.*)" = (.*)/.exec(data)
			if (match) {
				const param = match[1]
				const value = match[2]

				// Check parameter type
				if (param.indexOf('_mute') !== -1) {
					this.channelMuteStatus[param] = parseInt(value, 10)
					this.checkFeedbacks('channelMuteStatus')
				} else if (param.indexOf('matrix_mute') !== -1) {
					const [input, output] = param.split(' to ')
					const key = `${input}:${output}`
					this.crosspointMuteStatus[key] = parseInt(value, 10)
					this.checkFeedbacks('crosspointMuteStatus')
				} else if (param.indexOf('_en') !== -1) {
					this.filterStatus[param] = parseInt(value, 10)
					this.checkFeedbacks('filterStatus')
				}
			}
		}
	}

	parseChannelList(data) {
		// Implement parsing logic based on the response format
		// Example:
		const channels = data.split('\n').map(line => line.trim()).filter(line => line)
		this.log('info', `Enumerated channels: ${channels.join(', ')}`)
		// Store or use the channels as needed
	}

	checkDiscoveryComplete() {
		return (
			this.channels.virtual.length > 0 ||
			this.channels.inputs.length > 0 ||
			this.channels.outputs.length > 0 ||
			this.channels.mics.length > 0 ||
			this.channels.groups.length > 0
		)
	}

	finalizeDiscovery() {
		if (this.discoveryTimeout) {
			clearTimeout(this.discoveryTimeout)
			this.discoveryTimeout = null
		}

		this.discoveryInProgress = false
		this.log('info', 'Channel discovery completed')
		this.log('debug', 'Discovered channels:', JSON.stringify(this.channels, null, 2))

		// Update the available choices in your actions
		this.updateActions()

		// Emit variables with the channel counts
		this.setVariableValues({
			'virtual_channel_count': this.channels.virtual.length,
			'input_channel_count': this.channels.inputs.length,
			'output_channel_count': this.channels.outputs.length,
			'mic_channel_count': this.channels.mics.length,
			'group_count': this.channels.groups.length
		})
	}

	sendCommand(cmd) {
		if (this.socket && this.socket.isConnected) {
			this.log('debug', `Sending command: ${cmd}`)
			this.socket.send(`${cmd}\r\n`)
			this.log('debug', `Command sent: ${cmd}`)

			// Set a timeout to handle cases where no response is received
			const timeout = setTimeout(() => {
				this.log('error', `Command timed out: ${cmd}`)
			}, 5000) // 5 seconds timeout

			this.socket.on('data', (data) => {
				clearTimeout(timeout)
				this.log('debug', `Response received: ${data}`)

				// Check for specific error messages
				if (data.includes('error')) {
					this.log('error', `Error response: ${data}`)
				} else {
					// Handle the response data here
				}
			})
		} else {
			this.log('error', 'Socket not connected')
		}
	}

	enumerateChannels() {
		if (this.socket && this.socket.isConnected) {
			const cmd = 'list_channels' // Replace with the actual command to list channels
			this.log('debug', `Sending command to enumerate channels: ${cmd}`)
			this.socket.send(`${cmd}\r\n`)
			this.log('debug', `Command sent: ${cmd}`)

			// Set a timeout to handle cases where no response is received
			const timeout = setTimeout(() => {
				this.log('error', `Command timed out: ${cmd}`)
			}, 5000) // 5 seconds timeout

			this.socket.on('data', (data) => {
				clearTimeout(timeout)
				this.log('debug', `Response received: ${data}`)

				// Parse the response to enumerate channels
				if (data.includes('error')) {
					this.log('error', `Error response: ${data}`)
				} else {
					this.parseChannelList(data)
				}
			})
		} else {
			this.log('error', 'Socket not connected')
		}
	}
}

// Example usage
enumerateChannels()

runEntrypoint(ModuleInstance, UpgradeScripts)