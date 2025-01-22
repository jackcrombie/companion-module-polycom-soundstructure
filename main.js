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

	// Discovery Methods
	async discoverChannels() {
		if (this.discoveryInProgress) {
			this.log('debug', 'Discovery already in progress')
			return
		}

		this.discoveryInProgress = true
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
				this.log('warn', 'Channel discovery timed out')
				this.updateStatus(InstanceStatus.Ok, 'Discovery timed out')
			}
		}, 10000) // 10 second timeout

		// Send discovery commands
		this.sendCommand('get virtual_channels')
		this.sendCommand('get line_inputs')
		this.sendCommand('get line_outputs')
		this.sendCommand('get mic_inputs')
		this.sendCommand('get groups')
	}

	parseChannelList(data) {
		// Remove any surrounding quotes and split by comma
		return data.split(',')
			.map(channel => channel.trim().replace(/^"(.*)"$/, '$1'))
			.filter(channel => channel.length > 0)
	}

	checkDiscoveryComplete() {
		// Check if we've received at least some channels
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

	processDeviceData(data) {
		this.log('debug', `Data received: ${data}`)

		// Handle discovery responses
		if (this.discoveryInProgress) {
			if (data.startsWith('virtual_channels=')) {
				this.channels.virtual = this.parseChannelList(data.substring('virtual_channels='.length))
				this.channels.virtual.forEach(channel => this.channelTypes[channel] = 'virtual')
			}
			else if (data.startsWith('line_inputs=')) {
				this.channels.inputs = this.parseChannelList(data.substring('line_inputs='.length))
				this.channels.inputs.forEach(channel => this.channelTypes[channel] = 'input')
			}
			else if (data.startsWith('line_outputs=')) {
				this.channels.outputs = this.parseChannelList(data.substring('line_outputs='.length))
				this.channels.outputs.forEach(channel => this.channelTypes[channel] = 'output')
			}
			else if (data.startsWith('mic_inputs=')) {
				this.channels.mics = this.parseChannelList(data.substring('mic_inputs='.length))
				this.channels.mics.forEach(channel => this.channelTypes[channel] = 'mic')
			}
			else if (data.startsWith('groups=')) {
				this.channels.groups = this.parseChannelList(data.substring('groups='.length))
				this.channels.groups.forEach(channel => this.channelTypes[channel] = 'group')
			}

			// Check if discovery is complete
			if (this.checkDiscoveryComplete()) {
				this.finalizeDiscovery()
			}
		}

		// Handle state responses
		if (data.startsWith('val ')) {
			const match = /val "(.*)" = (.*)/.exec(data)
			if (match) {
				const [, param, value] = match
				if (param.endsWith('_mute')) {
					this.channelMuteStatus[param] = parseInt(value, 10)
					this.checkFeedbacks('channelMuteStatus')
				} else if (param.includes('matrix_mute')) {
					const [input, output] = param.split(' to ')
					const key = `${input}:${output}`
					this.crosspointMuteStatus[key] = parseInt(value, 10)
					this.checkFeedbacks('crosspointMuteStatus')
				} else if (param.endsWith('_en')) {
					this.filterStatus[param] = parseInt(value, 10)
					this.checkFeedbacks('filterStatus')
				}
			}
		}
	}

	sendCommand(cmd) {
		if (this.socket && this.socket.isConnected) {
			this.socket.send(`${cmd}\r\n`)
			this.log('debug', `Command sent: ${cmd}`)
		} else {
			this.log('error', 'Socket not connected')
		}
	}
}

runEntrypoint(ModuleInstance, UpgradeScripts)