const { combineRgb } = require('@companion-module/base')

function getChoices(self, type) {
	let channels = Object.values(self.state.virtualChannels)
	let groups = Object.keys(self.state.groups)
	let choices = []

	switch (type) {
		case 'group':
			choices = groups.map((g) => ({ id: g, label: g }))
			break
		case 'channel':
			choices = channels
				.filter((c) => c.pctype !== 'control' && c.pctype !== 'submix')
				.map((c) => ({ id: c.label, label: c.label }))
			break
		default: // 'all'
			choices = channels.map((c) => ({ id: c.label, label: c.label }))
			break
	}

	if (choices.length === 0) {
		return [{ id: 'none', label: `No ${type}s discovered` }]
	}
	return choices
}

function updateFeedbacks(self) {
	const feedbacks = {}

	const defaultMuteStyle = {
		color: combineRgb(255, 255, 255),
		bgcolor: combineRgb(255, 0, 0),
	}

	feedbacks.channel_muted = {
		type: 'boolean',
		name: 'Channel is Muted',
		description: 'If the selected channel is muted, change the style of the button.',
		options: [{ type: 'dropdown', id: 'channel', label: 'Channel', choices: getChoices(self, 'channel') }],
		defaultStyle: defaultMuteStyle,
		callback: (feedback) => {
			const channel = self.state.virtualChannels[feedback.options.channel]
			return channel ? channel.mute === 1 : false
		},
	}

	feedbacks.group_muted = {
		type: 'boolean',
		name: 'Group is Muted',
		description: 'If the selected group is muted, change the style of the button.',
		options: [{ type: 'dropdown', id: 'group', label: 'Group', choices: getChoices(self, 'group') }],
		defaultStyle: defaultMuteStyle,
		callback: (feedback) => {
			// A group's mute state is determined by the mute state of its corresponding virtual channel
			const groupAsChannel = self.state.virtualChannels[feedback.options.group]
			return groupAsChannel ? groupAsChannel.mute === 1 : false
		},
	}

	feedbacks.crosspoint_muted = {
		type: 'boolean',
		name: 'Matrix Crosspoint Muted',
		description: 'If the specified matrix crosspoint is muted, change the style.',
		options: [
			{ type: 'dropdown', id: 'input', label: 'Input', choices: getChoices(self, 'all') },
			{ type: 'dropdown', id: 'output', label: 'Output', choices: getChoices(self, 'all') },
		],
		defaultStyle: defaultMuteStyle,
		callback: (feedback) => {
			const { input, output } = feedback.options
			if (self.state.matrix && self.state.matrix[input] && self.state.matrix[input][output]) {
				return self.state.matrix[input][output].mute === 1
			}
			return false
		},
	}

	return feedbacks
}

module.exports = {
	updateFeedbacks,
}