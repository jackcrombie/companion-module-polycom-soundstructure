module.exports = function (self) {
    self.setActionDefinitions({
        set_mute: {
            name: 'Set Channel Mute',
            options: [
                {
                    type: 'dropdown',
                    label: 'Channel Type',
                    id: 'channelType',
                    choices: [
                        { id: 'all', label: 'All Channels' },
                        { id: 'virtual', label: 'Virtual Channels' },
                        { id: 'inputs', label: 'Line Inputs' },
                        { id: 'outputs', label: 'Line Outputs' },
                        { id: 'mics', label: 'Microphones' },
                        { id: 'groups', label: 'Groups' }
                    ],
                    default: 'all'
                },
                {
                    type: 'dropdown',
                    label: 'Channel',
                    id: 'channel',
                    choices: (action) => {
                        if (!action || !action.options) return []
                        
                        switch(action.options.channelType) {
                            case 'virtual':
                                return self.channels.virtual.map(ch => ({ id: ch, label: ch }))
                            case 'inputs':
                                return self.channels.inputs.map(ch => ({ id: ch, label: ch }))
                            case 'outputs':
                                return self.channels.outputs.map(ch => ({ id: ch, label: ch }))
                            case 'mics':
                                return self.channels.mics.map(ch => ({ id: ch, label: ch }))
                            case 'groups':
                                return self.channels.groups.map(ch => ({ id: ch, label: ch }))
                            default:
                                return [
                                    ...self.channels.virtual.map(ch => ({ id: ch, label: ch })),
                                    ...self.channels.inputs.map(ch => ({ id: ch, label: ch })),
                                    ...self.channels.outputs.map(ch => ({ id: ch, label: ch })),
                                    ...self.channels.mics.map(ch => ({ id: ch, label: ch })),
                                    ...self.channels.groups.map(ch => ({ id: ch, label: ch }))
                                ]
                        }
                    },
                    default: ''
                },
                {
                    type: 'checkbox',
                    label: 'Mute',
                    id: 'mute',
                    default: true
                }
            ],
            callback: async (event) => {
                self.sendCommand(`set matrix_mute "${event.options.channel}" ${event.options.mute ? '1' : '0'}`)
            }
        },

        set_matrix_mute: {
            name: 'Set Matrix Route Mute',
            options: [
                {
                    type: 'dropdown',
                    label: 'Input Type',
                    id: 'inputType',
                    choices: [
                        { id: 'virtual', label: 'Virtual Channels' },
                        { id: 'inputs', label: 'Line Inputs' },
                        { id: 'outputs', label: 'Line Outputs' },
                        { id: 'mics', label: 'Microphones' },
                        { id: 'groups', label: 'Groups' }
                    ],
                    default: 'virtual'
                },
                {
                    type: 'dropdown',
                    label: 'Input Channel',
                    id: 'input',
                    choices: (action) => {
                        if (!action || !action.options) return []
                        
                        switch(action.options.inputType) {
                            case 'virtual':
                                return self.channels.virtual.map(ch => ({ id: ch, label: ch }))
                            case 'inputs':
                                return self.channels.inputs.map(ch => ({ id: ch, label: ch }))
                            case 'outputs':
                                return self.channels.outputs.map(ch => ({ id: ch, label: ch }))
                            case 'mics':
                                return self.channels.mics.map(ch => ({ id: ch, label: ch }))
                            case 'groups':
                                return self.channels.groups.map(ch => ({ id: ch, label: ch }))
                            default:
                                return []
                        }
                    },
                    default: ''
                },
                {
                    type: 'dropdown',
                    label: 'Output Channel',
                    id: 'output',
                    choices: (action) => {
                        if (!action || !action.options) return []
                        
                        switch(action.options.inputType) {
                            case 'virtual':
                                return self.channels.virtual.map(ch => ({ id: ch, label: ch }))
                            case 'inputs':
                                return self.channels.inputs.map(ch => ({ id: ch, label: ch }))
                            case 'outputs':
                                return self.channels.outputs.map(ch => ({ id: ch, label: ch }))
                            case 'mics':
                                return self.channels.mics.map(ch => ({ id: ch, label: ch }))
                            case 'groups':
                                return self.channels.groups.map(ch => ({ id: ch, label: ch }))
                            default:
                                return []
                        }
                    },
                    default: ''
                },
                {
                    type: 'checkbox',
                    label: 'Mute',
                    id: 'mute',
                    default: true
                }
            ],
            callback: async (event) => {
                self.sendCommand(`set matrix_mute "${event.options.input}" "${event.options.output}" ${event.options.mute ? '1' : '0'}`)
            }
        }
    })
}