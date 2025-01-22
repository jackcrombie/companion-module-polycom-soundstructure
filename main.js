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
		this.filterStatus = {}
		this.buffer = ''
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
				this.queryState()
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
		}
	}

	queryState() {
		// Query initial states
		this.sendCommand('get virtual_channels')
		this.sendCommand('get presets')
		this.sendCommand('get mute "*"')
		this.sendCommand('get matrix_mute "*" "*"')
		this.sendCommand('get hpf_en "*"')
		this.sendCommand('get lpf_en "*"')
	}

	processDeviceData(data) {
		this.log('debug', `Data received: ${data}`)
		
		// Parse different types of responses
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