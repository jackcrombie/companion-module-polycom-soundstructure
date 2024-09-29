const { InstanceBase, Regex, runEntrypoint, InstanceStatus, TCPHelper } = require('@companion-module/base')
const UpgradeScripts = require('./upgrades')
const UpdateActions = require('./actions')
const UpdateFeedbacks = require('./feedbacks')
const UpdateVariableDefinitions = require('./variables')

class ModuleInstance extends InstanceBase {
	constructor(internal) {
		super(internal)

		this.socket = null
		this.virtualChannels = []
		this.presets = []
		this.channelMuteStatus = {}
		this.crosspointMuteStatus = {}
	}

	// Initialize the module with the given config
	async init(config) {
		this.config = config

		this.updateStatus(InstanceStatus.Ok)  // Mark status as OK
		this.connectToDevice()  // Establish TCP connection to the SoundStructure

		this.updateActions()  // Load dynamic actions
		this.updateFeedbacks()  // Set up feedbacks
		this.updateVariableDefinitions()  // Define any module variables
	}

	// Handle module destroy/cleanup
	async destroy() {
		if (this.socket) {
			this.socket.destroy()
			this.socket = null
		}
		this.log('debug', 'Module instance destroyed')
	}

	// Handle updated configuration
	async configUpdated(config) {
		this.config = config
		this.connectToDevice()  // Reconnect to the device with updated config
	}

	// Define configuration fields for the web UI
	getConfigFields() {
		return [
			{
				type: 'textinput',
				id: 'host',
				label: 'Target IP Address',
				width: 8,
				regex: Regex.IP,
			},
			{
				type: 'textinput',
				id: 'port',
				label: 'Target Port',
				width: 4,
				default: '23',
				regex: Regex.PORT,
			},
		]
	}

	// Handle actions export
	updateActions() {
		UpdateActions(this)  // Load dynamic actions from actions.js
	}

	// Handle feedbacks export
	updateFeedbacks() {
		UpdateFeedbacks(this)  // Load dynamic feedbacks from feedbacks.js
	}

	// Handle variable definitions export
	updateVariableDefinitions() {
		UpdateVariableDefinitions(this)  // Load dynamic variables from variables.js
	}

	// Function to establish a TCP connection
	connectToDevice() {
		if (this.socket) {
			this.socket.destroy()
			this.socket = null
		}

		// Use TCPHelper to simplify TCP connection management
		if (this.config.host && this.config.port) {
			this.socket = new TCPHelper(this.config.host, this.config.port)

			this.socket.on('connect', () => {
				this.updateStatus(InstanceStatus.Ok)
				this.log('info', `Connected to SoundStructure at ${this.config.host}:${this.config.port}`)
				this.requestDeviceConfiguration()  // Query the device for virtual channels and presets
			})

			this.socket.on('data', (data) => {
				this.processDeviceData(data.toString())
			})

			this.socket.on('error', (err) => {
				this.updateStatus(InstanceStatus.Error, err.message)
				this.log('error', `Connection error: ${err.message}`)
			})

			this.socket.on('close', () => {
				this.updateStatus(InstanceStatus.Disconnected, 'Connection closed')
				this.log('warn', 'Connection closed')
			})
		}
	}

	// Request virtual channels and presets from the device
	requestDeviceConfiguration() {
		this.sendCommand('get virtual_channels')
		this.sendCommand('get presets')
	}

	// Handle processing of incoming data from the device
	processDeviceData(data) {
		this.log('debug', `Data received: ${data}`)
		if (data.startsWith('virtual_channels=')) {
			this.virtualChannels = data.substring('virtual_channels='.length).split(',').map((v) => v.trim())
			this.updateActions()  // Update actions dynamically based on retrieved virtual channels
		} else if (data.startsWith('presets=')) {
			this.presets = data.substring('presets='.length).split(',').map((p) => p.replace(/"/g, '').trim())
			this.updateActions()  // Update actions with dynamic preset list
		} else if (data.startsWith('mute ')) {
			const [info, value] = data.split('=')
			const match = /mute "(.*)"/.exec(info)
			if (match) {
				const channel = match[1]
				this.channelMuteStatus[channel] = parseInt(value, 10)
				this.checkFeedbacks('channelMuteStatus')  // Update mute feedbacks
			}
		} else if (data.startsWith('crosspoint_mute ')) {
			const [info, value] = data.split('=')
			const regex = /crosspoint_mute "(.*)" "(.*)"/
			const match = regex.exec(info)
			if (match) {
				const input = match[1]
				const output = match[2]
				const key = `${input}:${output}`
				this.crosspointMuteStatus[key] = parseInt(value, 10)
				this.checkFeedbacks('crosspointMuteStatus')  // Update crosspoint mute feedbacks
			}
		}
	}

	// Send command to the SoundStructure device
	sendCommand(cmd) {
		if (this.socket && this.socket.isConnected) {
			this.socket.send(`${cmd}\r\n`)
			this.log('debug', `Command sent: ${cmd}`)
		} else {
			this.log('error', 'Socket not connected')
		}
	}
}

// Run the module using the entry point provided by Bitfocus Companion
runEntrypoint(ModuleInstance, UpgradeScripts)
