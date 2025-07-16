const { InstanceBase, Regex, runEntrypoint, InstanceStatus, TCPHelper } = require('@companion-module/base')
const UpgradeScripts = require('./upgrades')
const { updateActions } = require('./actions')
const { updateFeedbacks } = require('./feedbacks')
const { updateVariableDefinitions } = require('./variables')
const { sanitize } = require('./utils')

class ModuleInstance extends InstanceBase {
	constructor(internal) {
		super(internal)
		this.commandQueue = []
		this.buffer = ''
		this.commandTimer = null
		this.discoveryTimer = null
		this.resetState()
	}

	resetState() {
		this.state = {
			virtualChannels: {},
			groups: {},
			matrix: {},
		}
		this.discoveryComplete = false
	}

	async init(config) {
		this.log('info', 'Initializing module...')
		this.config = config
		this.initActions()
		this.initFeedbacks()
		this.initVariables()
		this.initConnection()
		this.startCommandQueue()
	}

	async destroy() {
		this.log('info', 'Destroying module...')
		this.stopCommandQueue()
		if (this.discoveryTimer) clearTimeout(this.discoveryTimer)
		if (this.socket) this.socket.destroy()
		this.updateStatus(InstanceStatus.Disconnected)
	}

	async configUpdated(config) {
		this.log('info', 'Configuration updated. Re-initializing...')
		this.config = config
		this.initConnection()
	}

	getConfigFields() {
		return [
			{
				type: 'static-text',
				id: 'info',
				width: 12,
				label: 'Information',
				value: 'This module controls Polycom SoundStructure devices.',
			},
			{
				type: 'textinput',
				id: 'host',
				label: 'Target IP',
				width: 8,
				regex: Regex.IP,
				required: true,
			},
			{
				type: 'textinput',
				id: 'port',
				label: 'Target Port',
				width: 4,
				default: 52774,
				regex: Regex.PORT,
				required: true,
			},
		]
	}

	initConnection() {
		this.log('info', `Attempting to connect to ${this.config.host}:${this.config.port}`)
		if (this.socket) this.socket.destroy()
		this.updateStatus(InstanceStatus.Connecting)

		if (this.config.host && this.config.port) {
			this.socket = new TCPHelper(this.config.host, this.config.port)
			this.socket.on('status_change', (status, message) => {
				this.log('info', `Connection status changed: ${status} - ${message}`)
				this.updateStatus(status, message)
			})
			this.socket.on('error', (err) => {
				this.log('error', `Network error: ${err.message}`)
				this.updateStatus(InstanceStatus.ConnectionFailure, err.message)
			})
			this.socket.on('connect', () => {
				this.log('info', 'Successfully connected to device.')
				this.updateStatus(InstanceStatus.Ok)
				this.buffer = ''
				this.startDiscovery()
			})
			this.socket.on('data', (data) => {
				this.buffer += data.toString('utf8')
				this.processBuffer()
			})
		} else {
			this.updateStatus(InstanceStatus.BadConfig)
		}
	}

	processBuffer() {
		let EOL
		while ((EOL = this.buffer.indexOf('\r')) !== -1) {
			const line = this.buffer.substring(0, EOL).trim()
			this.buffer = this.buffer.substring(EOL + 1)
			if (line) this.processLine(line)
		}
	}

	processLine(line) {
		this.log('debug', `RECV: ${line}`)

		if (!this.discoveryComplete) {
			if (line.startsWith('vcitem')) {
				const match = /vcitem "([^"]+)" (\w+) (\w+)/.exec(line)
				if (match) {
					const [, label, vctype, pctype] = match
					this.log('debug', `Discovered Channel: ${label}`)
					if (!this.state.virtualChannels[label]) {
						this.state.virtualChannels[label] = { label, vctype, pctype, mute: 0, gain: 0 }
					}
				}
			} else if (line.startsWith('vcgitem')) {
				const parts = line.match(/"[^"]+"|\S+/g) || []
				if (parts.length > 1) {
					const groupName = parts[1].replace(/"/g, '')
					const members = parts.slice(2).map((m) => m.replace(/"/g, ''))
					this.state.groups[groupName] = members
					this.log('debug', `Discovered Group: ${groupName}`)
				}
			}
		}

		if (line.startsWith('val mute')) {
			const match = /val mute "([^"]+)" = (\d)/.exec(line)
			if (match) {
				const channel = this.state.virtualChannels[match[1]]
				if (channel) {
					channel.mute = parseInt(match[2])
					this.setVariableValues({ [`mute_${sanitize(channel.label)}`]: channel.mute })
					this.checkFeedbacks()
				}
			}
		} else if (line.startsWith('val fader')) {
			const match = /val fader "([^"]+)" = ([\d.-]+)/.exec(line)
			if (match) {
				const channel = this.state.virtualChannels[match[1]]
				if (channel) {
					channel.gain = parseFloat(match[2])
					this.setVariableValues({ [`gain_${sanitize(channel.label)}`]: channel.gain })
					this.checkFeedbacks()
				}
			}
		} else if (line.startsWith('val matrix_mute')) {
			const match = /val matrix_mute "([^"]+)" "([^"]+)" = (\d)/.exec(line)
			if (match) {
				const [, input, output, mute] = match
				if (!this.state.matrix[input]) this.state.matrix[input] = {}
				this.state.matrix[input][output] = { mute: parseInt(mute) }
				this.setVariableValues({ [`matrix_mute_${sanitize(input)}_${sanitize(output)}`]: parseInt(mute) })
				this.checkFeedbacks()
			}
		} else if (line.startsWith('val matrix_gain')) {
			const match = /val matrix_gain "([^"]+)" "([^"]+)" = ([\d.-]+)/.exec(line)
			if (match) {
				const [, input, output, gain] = match
				if (!this.state.matrix[input]) this.state.matrix[input] = {}
				if (!this.state.matrix[input][output]) this.state.matrix[input][output] = {}
				this.state.matrix[input][output].gain = parseFloat(gain)
				this.setVariableValues({ [`matrix_gain_${sanitize(input)}_${sanitize(output)}`]: parseFloat(gain) })
			}
		} else if (line.toUpperCase().startsWith('ERROR')) {
			this.log('error', `Received error from device: ${line}`)
		}
	}

	sendCommand(command) {
		if (command) this.commandQueue.push(command)
	}

	startCommandQueue() {
		if (this.commandTimer === null) {
			this.commandTimer = setInterval(() => {
				if (this.commandQueue.length > 0) {
					const command = this.commandQueue.shift()
					if (this.socket && this.socket.isConnected) {
						this.log('debug', `SEND: ${command}`)
						this.socket.send(`${command}\r\n`)
					} else {
						this.log('warn', `Socket not connected, command '${command}' not sent.`)
					}
				}
			}, 50)
		}
	}

	stopCommandQueue() {
		if (this.commandTimer) {
			clearInterval(this.commandTimer)
			this.commandTimer = null
		}
	}

	startDiscovery() {
		this.log('info', 'Starting device discovery...')
		this.resetState()
		this.discoveryComplete = false
		this.sendCommand('vclist')
		this.sendCommand('vcglist')
		if (this.discoveryTimer) clearTimeout(this.discoveryTimer)
		this.discoveryTimer = setTimeout(() => this.finalizeDiscovery(), 3000)
	}

	finalizeDiscovery() {
		if (this.discoveryComplete) return
		this.discoveryComplete = true
		this.log('info', 'Discovery timer elapsed. Now fetching initial states.')
		const channels = Object.values(this.state.virtualChannels)

		if (channels.length === 0) {
			this.log('warn', 'No channels discovered. Dropdowns will be empty.')
		} else {
			this.log('info', `Discovered ${channels.length} channels and ${Object.keys(this.state.groups).length} groups.`)
			channels.forEach((channel) => {
				if (channel.pctype !== 'control' && !channel.pctype.startsWith('clink')) {
					this.sendCommand(`get mute "${channel.label}"`)
					if (channel.pctype !== 'pstn_in' && channel.pctype !== 'pstn_out' && channel.pctype !== 'sig_gen') {
						this.sendCommand(`get fader "${channel.label}"`)
					}
				}
			})

			const matrixInputs = channels.filter((c) => c.pctype.includes('_in') || c.pctype === 'sig_gen' || c.pctype === 'submix')
			const matrixOutputs = channels.filter((c) => c.pctype.includes('_out') || c.pctype === 'submix')

			for (const inputChannel of matrixInputs) {
				for (const outputChannel of matrixOutputs) {
					if (inputChannel.label === outputChannel.label && inputChannel.pctype === 'submix') {
						continue
					}
					this.sendCommand(`get matrix_mute "${inputChannel.label}" "${outputChannel.label}"`)
					this.sendCommand(`get matrix_gain "${inputChannel.label}" "${outputChannel.label}"`)
				}
			}
		}

		this.log('info', 'Updating definitions.')
		this.initActions()
		this.initFeedbacks()
		this.initVariables()
	}

	initActions() {
		this.setActionDefinitions(updateActions(this))
	}

	initFeedbacks() {
		this.setFeedbackDefinitions(updateFeedbacks(this))
	}

	initVariables() {
		this.setVariableDefinitions(updateVariableDefinitions(this))
	}
}

runEntrypoint(ModuleInstance, UpgradeScripts)
