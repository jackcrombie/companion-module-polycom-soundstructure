const { sanitize } = require('./utils')

function updateVariableDefinitions(self) {
	const variables = []
	const channels = Object.values(self.state.virtualChannels)

	if (channels.length === 0) {
		return []
	}

	// Channel and Group Variables
	channels.forEach((channel) => {
		const safeLabel = sanitize(channel.label)
		variables.push({
			variableId: `mute_${safeLabel}`,
			name: `Mute status for ${channel.label}`,
		})
		// Only add gain variables for channels that support it
		if (channel.pctype !== 'pstn_in' && channel.pctype !== 'sig_gen' && channel.pctype !== 'control') {
			variables.push({
				variableId: `gain_${safeLabel}`,
				name: `Gain for ${channel.label}`,
			})
		}
	})

	// Matrix Mute Variables
	const matrixInputs = channels.filter((c) => c.pctype.includes('_in') || c.pctype === 'sig_gen' || c.pctype === 'submix')
	const matrixOutputs = channels.filter((c) => c.pctype.includes('_out') || c.pctype === 'submix')

	matrixInputs.forEach((input) => {
		matrixOutputs.forEach((output) => {
			if (input.label === output.label && input.pctype === 'submix') {
				return // Skip self-to-self for submixes
			}
			const safeInput = sanitize(input.label)
			const safeOutput = sanitize(output.label)
			variables.push({
				variableId: `matrix_mute_${safeInput}_${safeOutput}`,
				name: `Matrix Mute for ${input.label} to ${output.label}`,
			})
			variables.push({
				variableId: `matrix_gain_${safeInput}_${safeOutput}`,
				name: `Matrix Gain for ${input.label} to ${output.label}`,
			})
		})
	})

	return variables
}

module.exports = {
	updateVariableDefinitions,
}
