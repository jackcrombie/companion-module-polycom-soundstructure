function getChoices(self, type) {
	let channels = Object.values(self.state.virtualChannels)
	let groups = Object.keys(self.state.groups)
	let choices = []

	switch (type) {
		case 'group':
			choices = groups.map((g) => ({ id: g, label: g }))
			break
		case 'mic_in':
			choices = channels.filter((c) => c.pctype.includes('mic_in')).map((c) => ({ id: c.label, label: c.label }))
			break
		case 'line_out':
			choices = channels.filter((c) => c.pctype.includes('line_out')).map((c) => ({ id: c.label, label: c.label }))
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

function updateActions(self) {
	const actions = {}

	// --- Channel Actions ---
	actions.channel_mute = {
		name: 'Set/Toggle Channel Mute',
		options: [
			{ type: 'dropdown', id: 'channel', label: 'Channel', choices: getChoices(self, 'channel') },
			{
				type: 'dropdown',
				id: 'mute',
				label: 'Mute',
				choices: [
					{ id: '1', label: 'Mute' },
					{ id: '0', label: 'Unmute' },
					{ id: 'tog', label: 'Toggle' },
				],
				default: 'tog',
			},
		],
		callback: ({ options }) => {
			if (options.channel === 'none') return
			const cmd = options.mute === 'tog' ? 'tog' : 'set'
			const value = options.mute === 'tog' ? '' : ` ${options.mute}`
			self.sendCommand(`${cmd} mute "${options.channel}"${value}`)
		},
	}

	actions.channel_fader = {
		name: 'Set/Adjust Channel Fader',
		options: [
			{ type: 'dropdown', id: 'channel', label: 'Channel', choices: getChoices(self, 'channel') },
			{
				type: 'dropdown',
				id: 'mode',
				label: 'Mode',
				choices: ['set', 'inc', 'dec'],
				default: 'set',
			},
			{ type: 'number', id: 'value', label: 'Value (dB)', default: 0, min: -100, max: 20, step: 0.1 },
		],
		callback: ({ options }) => {
			if (options.channel === 'none') return
			self.sendCommand(`${options.mode} fader "${options.channel}" ${options.value}`)
		},
	}

	actions.mic_in_gain = {
		name: 'Set/Adjust Mic Input Gain',
		options: [
			{ type: 'dropdown', id: 'channel', label: 'Mic Input', choices: getChoices(self, 'mic_in') },
			{
				type: 'dropdown',
				id: 'mode',
				label: 'Mode',
				choices: ['set', 'inc', 'dec'],
				default: 'set',
			},
			{ type: 'number', id: 'value', label: 'Value (dB)', default: 0, min: -20, max: 64, step: 0.5 },
		],
		callback: ({ options }) => {
			if (options.channel === 'none') return
			self.sendCommand(`${options.mode} mic_in_gain "${options.channel}" ${options.value}`)
		},
	}

	actions.line_out_gain = {
		name: 'Set/Adjust Line Output Gain',
		options: [
			{ type: 'dropdown', id: 'channel', label: 'Line Output', choices: getChoices(self, 'line_out') },
			{
				type: 'dropdown',
				id: 'mode',
				label: 'Mode',
				choices: ['set', 'inc', 'dec'],
				default: 'set',
			},
			{ type: 'number', id: 'value', label: 'Value (dB)', default: 0, min: -100, max: 20, step: 0.5 },
		],
		callback: ({ options }) => {
			if (options.channel === 'none') return
			self.sendCommand(`${options.mode} line_out_gain "${options.channel}" ${options.value}`)
		},
	}

	// --- Group Actions ---
	actions.group_mute = {
		name: 'Set/Toggle Group Mute',
		options: [
			{ type: 'dropdown', id: 'group', label: 'Group', choices: getChoices(self, 'group') },
			{
				type: 'dropdown',
				id: 'mute',
				label: 'Mute',
				choices: [
					{ id: '1', label: 'Mute' },
					{ id: '0', label: 'Unmute' },
					{ id: 'tog', label: 'Toggle' },
				],
				default: 'tog',
			},
		],
		callback: ({ options }) => {
			if (options.group === 'none') return
			const cmd = options.mute === 'tog' ? 'tog' : 'set'
			const value = options.mute === 'tog' ? '' : ` ${options.mute}`
			self.sendCommand(`${cmd} mute "${options.group}"${value}`)
		},
	}

	// --- Matrix Actions ---
	actions.matrix_mute = {
		name: 'Set/Toggle Matrix Crosspoint Mute',
		options: [
			{ type: 'dropdown', id: 'input', label: 'Input', choices: getChoices(self, 'all') },
			{ type: 'dropdown', id: 'output', label: 'Output', choices: getChoices(self, 'all') },
			{
				type: 'dropdown',
				id: 'mute',
				label: 'Mute',
				choices: [
					{ id: '1', label: 'Mute' },
					{ id: '0', label: 'Unmute' },
					{ id: 'tog', label: 'Toggle' },
				],
				default: 'tog',
			},
		],
		callback: ({ options }) => {
			if (options.input === 'none' || options.output === 'none') return
			const cmd = options.mute === 'tog' ? 'tog' : 'set'
			const value = options.mute === 'tog' ? '' : ` ${options.mute}`
			self.sendCommand(`${cmd} matrix_mute "${options.input}" "${options.output}"${value}`)
		},
	}

	// --- Preset Actions ---
	actions.recall_preset = {
		name: 'Recall Preset',
		options: [{ type: 'textinput', id: 'preset', label: 'Preset Name' }],
		callback: ({ options }) => {
			if (options.preset) {
				self.sendCommand(`run preset "${options.preset}"`)
			}
		},
	}

	return actions
}

module.exports = {
	updateActions,
}