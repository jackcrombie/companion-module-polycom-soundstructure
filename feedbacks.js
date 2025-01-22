const { combineRgb } = require('@companion-module/base')

module.exports = async function (self) {
	self.setFeedbackDefinitions({
		channelMuteStatus: {
			type: 'boolean',
			name: 'Channel Mute Status',
			description: 'Changes button color based on channel mute status',
			options: [
				{
					type: 'textinput',
					label: 'Channel Name',
					id: 'channel',
					default: 'Speakers',
				},
			],
			defaultStyle: {
				bgcolor: combineRgb(255, 0, 0),
				color: combineRgb(255, 255, 255),
			},
			callback: (feedback) => {
				const channel = feedback.options.channel
				return self.channelMuteStatus[channel] === 1
			},
		},
		
		crosspointMuteStatus: {
			type: 'boolean',
			name: 'Matrix Route Mute Status',
			description: 'Changes button color based on matrix route mute status',
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
			],
			defaultStyle: {
				bgcolor: combineRgb(255, 0, 0),
				color: combineRgb(255, 255, 255),
			},
			callback: (feedback) => {
				const key = `${feedback.options.input}:${feedback.options.output}`
				return self.crosspointMuteStatus[key] === 1
			},
		},

		filterStatus: {
			type: 'boolean',
			name: 'Filter Status',
			description: 'Changes button color based on filter enable status',
			options: [
				{
					type: 'textinput',
					label: 'Channel Name',
					id: 'channel',
					default: 'Genelecs',
				},
				{
					type: 'dropdown',
					label: 'Filter Type',
					id: 'type',
					default: 'hpf',
					choices: [
						{ id: 'hpf', label: 'High Pass Filter' },
						{ id: 'lpf', label: 'Low Pass Filter' },
					],
				},
			],
			defaultStyle: {
				bgcolor: combineRgb(255, 0, 0),
				color: combineRgb(255, 255, 255),
			},
			callback: (feedback) => {
				const key = `${feedback.options.type}_${feedback.options.channel}`
				return self.filterStatus[key] === 1
			},
		},
	})
}