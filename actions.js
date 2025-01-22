const { combineRgb } = require('@companion-module/base')

module.exports = function (self) {
	self.setActionDefinitions({
		// Volume Controls
		increment_volume: {
			name: 'Increment Channel Volume',
			options: [
				{
					type: 'textinput',
					label: 'Channel Name',
					id: 'channel',
					default: 'Speakers',
				},
				{
					type: 'number',
					label: 'Amount (dB)',
					id: 'amount',
					default: 1,
					min: 0,
					max: 10,
				},
			],
			callback: async (event) => {
				self.sendCommand(`inc fader "${event.options.channel}" ${event.options.amount}`)
			},
		},
		decrement_volume: {
			name: 'Decrement Channel Volume',
			options: [
				{
					type: 'textinput',
					label: 'Channel Name',
					id: 'channel',
					default: 'Speakers',
				},
				{
					type: 'number',
					label: 'Amount (dB)',
					id: 'amount',
					default: 1,
					min: 0,
					max: 10,
				},
			],
			callback: async (event) => {
				self.sendCommand(`dec fader "${event.options.channel}" ${event.options.amount}`)
			},
		},
		
		// Line Out Gain Controls
		set_line_out_gain: {
			name: 'Set Line Out Gain',
			options: [
				{
					type: 'textinput',
					label: 'Channel Name',
					id: 'channel',
					default: 'Genelecs',
				},
				{
					type: 'number',
					label: 'Gain (dB)',
					id: 'gain',
					default: -24,
					min: -100,
					max: 20,
				},
			],
			callback: async (event) => {
				self.sendCommand(`set line_out_gain "${event.options.channel}" ${event.options.gain}`)
			},
		},

		// Mute Controls
		set_mute: {
			name: 'Set Channel Mute',
			options: [
				{
					type: 'textinput',
					label: 'Channel Name',
					id: 'channel',
					default: 'Speakers',
				},
				{
					type: 'checkbox',
					label: 'Mute',
					id: 'mute',
					default: true,
				},
			],
			callback: async (event) => {
				self.sendCommand(`set mute "${event.options.channel}" ${event.options.mute ? '1' : '0'}`)
			},
		},

		// Matrix Routing Controls
		set_matrix_mute: {
			name: 'Set Matrix Route Mute',
			options: [
				{
					type: 'textinput',
					label: 'Input Channel',
					id: 'input',
					default: 'Shotgun',
				},
				{
					type: 'textinput',
					label: 'Output Channel',
					id: 'output',
					default: 'Discord Out',
				},
				{
					type: 'checkbox',
					label: 'Mute',
					id: 'mute',
					default: true,
				},
			],
			callback: async (event) => {
				self.sendCommand(`set matrix_mute "${event.options.input}" "${event.options.output}" ${event.options.mute ? '1' : '0'}`)
			},
		},

		// Filter Controls
		set_hpf: {
			name: 'Set High Pass Filter',
			options: [
				{
					type: 'textinput',
					label: 'Channel Name',
					id: 'channel',
					default: 'Genelecs',
				},
				{
					type: 'checkbox',
					label: 'Enable',
					id: 'enable',
					default: true,
				},
			],
			callback: async (event) => {
				self.sendCommand(`set hpf_en "${event.options.channel}" ${event.options.enable ? '1' : '0'}`)
			},
		},
		set_lpf: {
			name: 'Set Low Pass Filter',
			options: [
				{
					type: 'textinput',
					label: 'Channel Name',
					id: 'channel',
					default: 'Sub',
				},
				{
					type: 'checkbox',
					label: 'Enable',
					id: 'enable',
					default: true,
				},
			],
			callback: async (event) => {
				self.sendCommand(`set lpf_en "${event.options.channel}" ${event.options.enable ? '1' : '0'}`)
			},
		},

		// Mic Input Gain Controls
		set_mic_gain: {
			name: 'Set Mic Input Gain',
			options: [
				{
					type: 'textinput',
					label: 'Channel Name',
					id: 'channel',
					default: 'Lounge Mic',
				},
				{
					type: 'number',
					label: 'Gain (dB)',
					id: 'gain',
					default: 0,
					min: -100,
					max: 20,
				},
			],
			callback: async (event) => {
				self.sendCommand(`set mic_in_gain "${event.options.channel}" ${event.options.gain}`)
			},
		},
	})
}