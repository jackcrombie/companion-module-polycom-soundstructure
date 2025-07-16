# Command Protocol Reference Guide

## Introduction

This chapter describes the SoundStructure™ command protocol used to control and configure the SoundStructure products via the RS-232 and Ethernet interfaces. The target audience for this document is the control system programmer and other application developers who need to understand how to control and configure SoundStructure devices.

The purpose of the SoundStructure command and control protocol is to provide an interface for configuring SoundStructure devices and controlling their operating parameters. With SoundStructure devices, a collection of SoundStructure devices linked over OBAM™ will behave as a single device and controlling the collection of devices only requires one connection to a control interface on any of the linked devices.

## SoundStructure Control Interfaces

The SoundStructure control protocol has been designed so that all features are available over all interfaces. Some features will only be practical over the higher-bandwidth connections (for example, firmware updates take much less time over the Ethernet interface than the RS-232 interface and signal meters are more responsive over the ethernet interface). While the SoundStructure Studio Windows software makes full use of this control protocol to configure and control SoundStructure, user applications, such as AMX® and Crestron® control systems will typically only use a subset of the control protocol to adjust settings and monitor system parameters for functions such as muting, volume control, and dialing.

## RS-232

A SoundStructure device's RS-232 port is a female DB9 DCE supporting a fixed data format of eight data bits, no parity, and one stop bit. The supported flow control options are hardware (RTS/CTS) and none. The supported baud rates are 9600, 19200, 38400, 57600, and 115200 with a default bit rate of 9600. This interface is primarily intended for connecting a control system (such as AMX or Crestron) to a SoundStructure device. However, other types of controllers (such as a Windows PC running SoundStructure Studio) may use this interface as well.

## Ethernet

Each SoundStructure device has a rear-panel Ethernet interface for connecting to the local area network. Connect to the SoundStructure device using port 52774 and a telnet connection. There is no user login required to interface to SoundStructure devices over this port.

Control systems and PCs running SoundStructure Studio may communicate with SoundStructure over this interface using port 52774. Each SoundStructure will support multiple simultaneous IP connections from its Ethernet controller.

Each collection of SoundStructure devices that are linked via the OBAM interface only requires a single LAN connection to control all the SoundStructure devices. SoundStructure devices also support having multiple linked devices with each device connected via Ethernet. Connecting to the network could be used to provide redundancy on the same network or can be used to connect the SoundStructure devices to more than one network.

The SoundStructure Ethernet interface can be configured to have either a static IP address or can accept a dynamic IP address from a DHCP server. By default the SoundStructure products will accept an IP address from a DHCP server.

## Virtual Channels

A virtual channel is a representation of an individual physical input or output channel. A virtual channel may also be a stereo pair of physical input or output channels. The virtual channel name that is created when the virtual channel is defined by the A/V designer is used to refer to that particular input or output instead of using the physical channel number. For example, the designer would define the virtual channel "Podium mic" that is connected to, for example, to input physical channel 9 and then refer to the virtual channel as "Podium mic". Once a virtual channel is defined, it is always used to reference that particular signal or signals.

The Virtual channel name is case-sensitive. "Podium Mic" and "PODIUM mic" would represent two different virtual channels.

The motivation for using virtual channels is both to allow the control system programming to start before the physical wiring may be known and to make the control system programming re-usable across different installations regardless of how the system is wired.

Virtual channels are a high-level representation that encompasses information about the physical channel and are used to configure and control the underlying physical channel(s) withouthaving to know which physical input or output the virtual channel is connected to after the virtual channel has been defined.

### Virtual Channel Types

Virtual channels are operated on by the command set which can apply parameter changes to the underlying physical channels.

#### Mono Virtual Channels
Mono virtual channels are a representation of a single physical channel. All parameters of the aphysical channel are controlled through the virtual channel. An example of where a mono virtual channel would be used is a microphone input.

#### Stereo Virtual Channels
Stereo virtual channels combine exactly two physical channels to create a stereo pair. All controls and processing take into account the stereo nature of the virtual channel.

### Virtual Channel Groups

It is often convenient to refer to a group of virtual channels and control a group of virtual channels with a single command. Virtual channel groups are used with SoundStructure products to create a single object made up of loosely associated virtual channels. Once a virtual channel group has been created, all commands to a virtual channel group will affect the virtual channels that are defined as part of the virtual channel group and command acknowledgements from all the members of the virtual channel group will be returned.

## SoundStructure Command Syntax

The description of the control protocol syntax in this section and elsewhere in this document refers to Unicode characters in four-digit hex format, such as 002A which is the asterisk character in the Basic Latin code page. This is consistent with references such as The Unicode Standard.

The control protocol consists of text-based, human-readable commands and status messages. Binary data transfers are possible (for example, transferring configuration files or sending meter data), but these transfers are initiated with text-based, human readable commands. The commands use the UTF-8 encoding for characters.

## Controlling SoundStructure Parameters

The SoundStructure command and control functions allow an external controller to set, query, and monitor parameters of one or more linked SoundStructure devices. There are three types of parameters that can be controlled:
*   system parameters,
*   virtual channel parameters, and
*   matrix parameters.

### System Parameters
System parameters are global and apply to a collection of OBAM-linked SoundStructure devices. A device-specific system parameter affects a parameter on a single SoundStructure device.

### Virtual Channel Parameters
Virtual channel parameters are addressed for a given virtual channel. Examples of virtual channel parameters include gain, AEC enable, and telephone dialing. These parameters are addressed by the virtual channel name that identifies the virtual channel to be controlled.

### Matrix Parameters
Matrix parameters are defined at crosspoints of the SoundStructure matrix mixer. Since a matrix crosspoint is defined by an input and an output, matrix parameters are addressed by two virtual channel names that identify the input and output virtual channels that define the crosspoint to be controlled.

Parameters can have access modes of read/write, read-only, or write-only. Some parameters can also support user-definable minimum and maximum limits such as volume control commands.

All parameter control commands operate on a specific type of parameter. The parameter types supported by the SoundStructure control protocol are:

*   **void**: Takes no argument, and must be write-only. For example, the `sys_reboot` parameter is a write-only void parameter that reboots the SoundStructure device when the command is executed.
*   **boolean**: Take one of two values: 0 or 1.
*   **integer**: Represent an integer value. When incremented or decremented beyond their range, they saturate to their maximum or minimum value, respectively.
*   **float**: Represent a floating-point value. When incremented or decremented beyond their range, they saturate to their maximum or minimum value, respectively.
*   **sequence**: Represent unsigned integer values. When incremented or decremented beyond their range, they wrap around to their minimum or maximum value, respectively.
*   **string**: Represent a string value.
*   **list**: Represent a sequence of string values.

## Command Format

Referring to the command hierarchy below, each sub-category of command inherits the syntax of its parent and adds further syntax requirements. Starting at the root of the hierarchy, all commands have the following syntax:
`<action> <data> <term>`
where `<action>` specifies the system-defined action, `<data>` is the action-specific arguments or payload data, and `<term>` is the command terminator.

### Actions
The `<action>` field, also known as the command action, consists only of lower-case characters.

### Data
The content and format of the command data is specific to the command action. The SoundStructure control protocol defines three primary groups of actions: channel definition actions, parameter control actions, and data transfer actions.

### Command Termination
Commands sent to SoundStructure must be terminated by either a single carriage return (000D) or a carriage return followed by a line feed (000A). The single carriage return is the preferred method of command termination.

All commands for example, acknowledgements) generated by SoundStructure will always be terminated with a single carriage return (000D).

### Command Acknowledgements
All commands generate acknowledgements. The format of the acknowledgement and whether it is sent to the originating interface or all interfaces depends on the specific command.

## Control Commands
Most of the commands in the SoundStructure control protocol fall under the category of control commands. All control commands have the following syntax:
`<action> [<arg> [<arg> [...]]] <term>`
where `<action>` specifies the system-defined command action and the `<term>` field is the command terminator.

The `<arg>` fields comprise the `<data>` portion of the command. They contain zero or more arguments specific to the given command action.

**Command Length**: All commands must be less than or equal to 2048 bytes in length, including the terminator.

**Argument Separation**: Control commands sent to SoundStructure must have all `<arg>` parameters separated by one or more space (0020) or tab (0009) characters.

**Argument Types**:
*   **Integer arguments**: Represent an integer value.
*   **Floating-point arguments**: Represent a floating-point value.
*   **System-Defined Text Arguments**: Text arguments that are defined by the command set.
*   **User-Defined Text Arguments**: Text arguments that are user-defined.

## Virtual Channel Definition Commands
Virtual channel definition commands are a type of control command that provide methods for defining virtual channels and mapping them to to physical channels.

### `vcdef`
Define a new virtual channel and its physical channel mapping.
**Syntax**: `vcdef <label> <vctype> <pctype> <num> [<num> ...] <term>`

*   `<label>`: A user-defined text argument that defines the name for the new virtual channel.
*   `<vctype>`: A system-defined text argument that defines the type of virtual channel that will be created.
    *   `mono`: A mono virtual channel.
    *   `stereo`: A stereo virtual channel.
    *   `control`: A control channel such as logic input or output or IR receiver.
    *   `control_array`: A collection of control pins, in other words a group of logic input or output pins.
*   `<pctype>`: A system-defined text argument that defines the physical channel type of the physical channels in the virtual channel.
    *   `cr_mic_in`: The physical channel is one of the mic/line inputs on a conferencing device.
    *   `cr_line_out`: The physical channel is one of the line outputs on a conferencing device.
    *   `sr_mic_in`: The physical channel is one of the mic/line inputs on a sound-reinforcement device.
    *   `sr_line_out`: The physical channel is one of the line outputs on a sound-reinforcement device.
    *   `pstn_in`: The physical channel for the receive signal to the analog telephony interface.
    *   `pstn_out`: The physical channel for the transmit signal to the analog telephony interface.
    *   `voip_in`: The physical channel for the receive signal to a VoIP telephony interface.
    *   `voip_out`: The physical channel for the transmit signal from the VoIP telephony interface.
    *   `sig_gen`: The physical channel is the signal generator input.
    *   `submix`: The physical channel is one of the sub-mix channels.
    *   `clink_in`: The physical channel is one of the ConferenceLink inputs.
    *   `clink_out`: The physical channel is one of the ConferenceLink outputs.
    *   `digital_gpio_in`: The physical channel for the digital logic input pins.
    *   `digital_gpio_out`: The physical channel for the digital logic output pins.
    *   `analog_gpio_in`: The physical channel for the analog logic input pins.
    *   `ir_in`: The physical channel for the infrared remote control port.
*   `<num>`: One or more integer arguments that define the physical channel number(s).

### `vclist`
The `vclist` action returns the complete list of virtual channels that have been defined. The vclist action accepts no arguments and has the following syntax: `vclist`
The acknowledgement will be `vcitem <label> <vctype> <pctype> <num> [...] <term>` for each virtual channel.

### `vcundef`
The `vcundef` action is a virtual channel definition command that undefines a virtual channel that was previously defined with the vcdef action.
**Syntax**: `vcundef <label> <term>`
*   `<label>`: A user-defined text argument that defines the name of the virtual channel to be undefined.

### `vcrename`
The `vcrename` action is a virtual channel definition command that changes the name of a virtual channel.
**Syntax**: `vcrename <label> <new-label> <term>`
*   `<label>`: A user-defined text argument that specifies the name of the virtual channel to be renamed.
*   `<new-label>`: A user-defined text argument that specifies the new name to assign to the virtual channel.

## Virtual Channel Group Definition Commands
Virtual channel group definition commands are a type of control command that provide methods for defining virtual channel groups.

### `vcgdef`
Define a new virtual channel group.
**Syntax**: `vcgdef <label> [<vcmember>] [<vcmember> ...] <term>`
*   `<label>`: The name of the new virtual channel group.
*   `<vcmember>`: The name of a virtual channel to be a member of the group.

### `vcgundef`
Delete a virtual channel group definition.
**Syntax**: `vcgundef <label> <term>`
*   `<label>`: The name of the virtual channel group to be undefined.

### `vcgrename`
Rename a virtual channel group.
**Syntax**: `vcgrename <label> <new-label> <term>`
*   `<label>`: The name of the virtual channel group to be renamed.
*   `<new-label>`: The new name to assign to the virtual channel group.

### `vcgadd`
Add a virtual channel member to a virtual channel group.
**Syntax**: `vcgadd <label> <vcmember> <term>`
*   `<label>`: The name of the virtual channel group to which the new member will be added.
*   `<vcmember>`: The name of the virtual channel to be added to the virtual channel group.

### `vcgremove`
Remove a virtual channel member from a virtual channel group.
**Syntax**: `vcgremove <label> <vcmember> <term>`
*   `<label>`: The name of the virtual channel group from which the member will be removed.
*   `<vcmember>`: The name of the virtual channel to be removed from the virtual channel group.

### `vcglist`
List the members of a virtual channel group.
**Syntax**: `vcglist <label> <term>`
*   `<label>`: The name of the virtual channel group that will have its members listed.
The acknowledgement uses the same syntax as the `vcgdef` command.

## Adjusting Parameters
Parameters are adjusted by executing commands on a SoundStructure device. There are three types of commands: system parameter commands, virtual channel commands, and matrix commands.

### Parameter Command Syntax
All parameter commands have the following syntax:
`<action> <param> [<limit>] [<chan>] [<index> [<index> ...]] [<arg>] <term>`

The fields in the command are described below.

*   `<action>`: This is a required field that specifies the action for the command.
    *   `get`: get the current value of the parameter
    *   `set`: set the current value of the parameter; requires the value as an argument
    *   `inc`: increment the current value; requires the value to increment by as an argument
    *   `dec`: decrement the current value; requires the value to decrement by as an argument
    *   `tog`: toggles the state of the current value; only applicable to Boolean commands
    *   `ping`: does not affect any parameter, just checks that the system is accessible
    *   `run`: runs a preset or partial preset
*   `<param>`: A system-defined text argument that specifies the name of the parameter on which to operate.
*   `<limit>`: An optional argument that can be specified for some commands.
    *   `min`: operate on the minimum limit for the parameter
    *   `max`: operate on the maximum limit for the parameter
*   `<chan>`: Commands that operate on virtual channels may require one or more channel arguments to define the channel on which to operate.
*   `<index>`: Parameters may be multi-dimensional. The `<index>` arguments are integer arguments used to address parameters with a dimensionality of one or higher.
*   `<arg>`: The meaning of the argument is specific to each parameter. The syntax of an argument is determined by its type.

### Parameter Modes
Each parameter command enforces one of the following modes for its parameter:
*   `read-write`: the parameter may be both queried and set
*   `read-only`: the parameter may be queried, but not set
*   `write-only`: the parameter may be set, but not queried

### Parameter Types
All commands fall into one of the following types:
*   **Void**: take no arguments. Void parameter commands do not support the `get`, `inc`, `dec`, or `tog` actions.
*   **Boolean**: argument must be either 0 or 1.
*   **Integer**: control integer-valued parameters.
*   **Float**: control floating point valued parameters.
*   **Sequence**: control integer-valued parameters that wrap around.
*   **String**: control string parameters.
*   **List**: control parameters that are strings that correspond to a list of pre-defined strings.

### Acknowledgements
All parameter commands result in acknowledgements from the SoundStructure device.

## Command List

The complete system parameter command reference is found in the file sound-structure-parameters.html on the CDROM and may also be found by browsing in the SoundStructure device’s web interface by pointing a browser at the IP address of the SoundStructure device.

The commands in this file are organized by the type of command including:
*   Gain and Mute
*   Matrix
*   Telephony
*   Equalizer
*   Dynamics Processing
*   Algorithm
*   Input path selection
*   Automix
*   GPIP Control parameters
*   Control Port Parameters
*   System Parameters

### Gain and Mute Parameters

#### `fader`
This parameter sets the fader level (in dB) in the digital domain.

*   **Argument Value**: Floating-Point
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: -100.0, Maximum: 20.0, Resolution: 0.1
*   **Default**: 0.0
*   **Event Source**: Yes

**Examples**
`set fader "Amplifier" 1`
`val fader "Amplifier" 1.0`

`set fader "Amplifier" 10`
`val fader "Amplifier" 10.0`

`get fader "Amplifier"`
`val fader "Amplifier" 10.0`

#### `line_out_gain`
This parameter sets the gain (in dB) of the line output.

*   **Argument Value**: Floating-Point
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: -100.0, Maximum: 20.0, Resolution: 0.5
*   **Default**: 0.0
*   **Event Source**: No

#### `meter_peak_hold_mode`
This parameter defines the peak hold behavior of all of the peak meters in the system. If the infinite peak hold mode is selected, the peaks can be reset using the `meter_peak_reset` parameter.

*   **Argument Value**: List
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Global System
*   **Values**: `none`, `hold`, `reset`
*   **Event Source**: No

#### `meter_peak_reset`
This parameter resets all of the peak meters in the system, if the peak meters are configured to have the infinite peak hold behavior.

*   **Argument Value**: Void
*   **Read/Write Mode**: Write-Only
*   **Channel Type**: Global System
*   **Event Source**: No

#### `mic_in_gain`
This parameter sets the gain (in dB) of the mic pre-amp.

*   **Argument Value**: Floating-Point
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: -20.0, Maximum: 64.0, Resolution: 0.5
*   **Default**: 0.0
*   **Event Source**: No

#### `mute`
This parameter sets the mute status of the virtual channel. A value of 0 indicates the virtual channel is unmuted, while a value of 1 indicates it is muted.

*   **Argument Value**: Boolean
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Default**: 0
*   **Event Source**: Yes

#### `phantom`
Enables or disables 48V phantom power on mic inputs. Setting `phantom` to 1 enables phantom power, while setting it to 0 disables phantom power.

*   **Argument Value**: Boolean
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Default**: 0
*   **Event Source**: Yes

#### `safety_mute`
This parameter sets the status of the safety mute. If safety mute is enabled (1), all line outputs of all the devices are muted.

*   **Argument Value**: Boolean
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Global System
*   **Default**: 0
*   **Event Source**: Yes

#### `signal_activity_thresh`
This parameter sets the threshold for the signal activity meter.

*   **Argument Value**: Floating-Point
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Global System
*   **System Limits**: Minimum: -100.0, Maximum: 20.0, Resolution: 0.1
*   **Default**: -20.0
*   **Event Source**: No

#### `trim`
This parameter applies gain (in the analog domain) to the individual components of a virtual channel. The index indicates to which physical channel of the virtual channel the trim will be applied. For example, indices 1 and 2 correspond to the left and right physical channels of a stereo virtual channel.

*   **Argument Value**: Floating-Point
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Indices**: 1-32
*   **System Limits**: Minimum: -20.0, Maximum: 20.0, Resolution: 0.5
*   **Default**: 0.0
*   **Event Source**: No

### Matrix Parameters

#### `matrix_balance`
This parameter is available at crosspoints where stereo virtual channels are mixed to mono or stereo virtual channels. The matrix_balance parameter provides a control to control the amount of gain going to the left and right channels.

*   **Argument Value**: Floating-Point
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Matrix
*   **System Limits**: Minimum: -1.0, Maximum: 1.0, Resolution: 0.01
*   **Default**: 0.0
*   **Event Source**: No

#### `matrix_gain`
This parameter sets the gain (in dB) for the specified crosspoint in the matrix mixer.

*   **Argument Value**: Floating-Point
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Matrix
*   **System Limits**: Minimum: -100.0, Maximum: 20.0, Resolution: 0.1
*   **Default**: 0.0
*   **Event Source**: Yes

#### `matrix_gate`
This parameter selects whether the gated (1) or ungated (0) version of the input signal is sent to the output.

*   **Argument Value**: Boolean
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Matrix
*   **Default**: 0
*   **Event Source**: No

#### `matrix_gate_type`
This parameter selects the gating style for crosspoints with conferencing inputs. Gating is enabled with the `matrix_gate` parameter.

*   **Argument Value**: List
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Matrix
*   **Values**: `conf` (default), `sr`
*   **Event Source**: No

#### `matrix_invert`
Inverts the specified crosspoint in the matrix mixer. Setting `matrix_invert` to 0 sets the crosspoint to normal polarity; setting `matrix_invert` to 1 inverts the crosspoint polarity.

*   **Argument Value**: Boolean
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Matrix
*   **Default**: 0
*   **Event Source**: No

#### `matrix_mute`
Mutes or unmutes the specified crosspoint in the matrix mixer. Setting `matrix_mute` to 1 mutes the crosspoint.

*   **Argument Value**: Boolean
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Matrix
*   **Default**: 1
*   **Event Source**: No

#### `matrix_pan`
This parameter is available at crosspoints where mono virtual channels are mixed to stereo virtual channels. The `matrix_pan` parameter provides a way to control the amount of gain going to the left and right channels.

*   **Argument Value**: Floating-Point
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Matrix
*   **System Limits**: Minimum: -1.0, Maximum: 1.0, Resolution: 0.01
*   **Default**: 0.0
*   **Event Source**: No

### Telephony Parameters

#### `phone_auto_answer_en`
This parameter enables (1) or disables (0) the auto-answer feature for the telephony interface.

*   **Argument Value**: Boolean
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Default**: 0
*   **Event Source**: No

#### `phone_connect`
This parameter sets the connection status of the telephony interface. Setting the phone_connect status to 1 connects the call, while setting it to 0 disconnects the call.

*   **Argument Value**: Boolean
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Default**: 0
*   **Event Source**: Yes

#### `phone_dial`
This command dials the specified string of digits on the telephony interface.

*   **Argument Value**: String
*   **Read/Write Mode**: Write-Only
*   **Channel Type**: Virtual Channel
*   **System Limits**: Max String Length: 32
*   **Event Source**: No

#### `phone_dial_backspace`
Setting this parameter deletes the most recently added character from the phone dial buffer.

*   **Argument Value**: Void
*   **Read/Write Mode**: Write-Only
*   **Channel Type**: Virtual Channel
*   **Event Source**: No

#### `phone_dial_tone_gain`
This parameter controls the gain that is applied to the incoming phone signal when dial tone is present.

*   **Argument Value**: Floating-Point
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: -100.0, Maximum: 20.0, Resolution: 0.1
*   **Default**: 0.0
*   **Event Source**: No

#### `phone_dtmf_gain`
This parameter sets the gain (in dB) applied to DTMF tones generated to the local room.

*   **Argument Value**: Floating-Point
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: -20.0, Maximum: 20.0, Resolution: 0.1
*   **Default**: 0.0
*   **Event Source**: No

#### `phone_entry_tone_en`
This parameter enables or disables entry tone generation for the telephony interface.

*   **Argument Value**: Boolean
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Default**: 1
*   **Event Source**: No

#### `phone_exit_tone_en`
This parameter enables or disables exit tone generation for the telephony interface.

*   **Argument Value**: Boolean
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Default**: 1
*   **Event Source**: No

#### `phone_flash`
Setting this parameter disconnects the telephony interface then reconnects it after a short delay.

*   **Argument Value**: Void
*   **Read/Write Mode**: Write-Only
*   **Channel Type**: Virtual Channel
*   **Event Source**: No

#### `phone_flash_delay`
This parameter sets the delay (in milliseconds) for the `phone_flash` parameter.

*   **Argument Value**: Integer
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: 100, Maximum: 5000
*   **Default**: 100
*   **Event Source**: No

#### `phone_ignore`
Ignore an incoming call.

*   **Argument Value**: Void
*   **Read/Write Mode**: Write-Only
*   **Channel Type**: Virtual Channel
*   **Event Source**: No

#### `phone_redial`
Setting this parameter causes the last number to be redialed on the telephony interface.

*   **Argument Value**: Void
*   **Read/Write Mode**: Write-Only
*   **Channel Type**: Virtual Channel
*   **Event Source**: No

#### `phone_reject`
Setting this parameter causes the incoming call to be rejected.

*   **Argument Value**: Void
*   **Read/Write Mode**: Write-Only
*   **Channel Type**: Virtual Channel
*   **Event Source**: No

#### `phone_ring`
This parameter indicates the ringing state for the telephony interface.

*   **Argument Value**: Boolean
*   **Read/Write Mode**: Read-Only
*   **Channel Type**: Virtual Channel
*   **Event Source**: Yes

#### `phone_ring_tone`
This parameter selects the type of ring tone to be generated for the telephony interface.
*   **Argument Value**: Sequence
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: 1, Maximum: 14
*   **Default**: 1
*   **Event Source**: No
*   **Values**:
    *   1: normal trill
    *   2: low trill
    *   3: low double trill
    *   4: medium trill
    *   5: medium double trill
    *   6: high trill
    *   7: high double trill
    *   8: highest trill
    *   9: highest double trill
    *   10: beeble
    *   11: triplet
    *   12: low trill precedence
    *   13: ring splash
    *   14: silent ring

#### `phone_ring_tone_en`
This parameter enables or disables ring tone generation for the telephony interface.

*   **Argument Value**: Boolean
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Default**: 1
*   **Event Source**: No

#### `phone_tone_gain`
This parameter sets the gain (in dB) applied to tones generated to the local room.

*   **Argument Value**: Floating-Point
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: -20.0, Maximum: 20.0, Resolution: 0.1
*   **Default**: 0.0
*   **Event Source**: No

#### `pstn_auto_hangup_loop_en`
This parameter enables (1) or disables (0) the auto-hangup on loop drop feature for the PSTN interface.

*   **Argument Value**: Boolean
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Default**: 0
*   **Event Source**: No

#### `pstn_auto_hangup_call_prog_en`
This parameter enables (1) or disables (0) the auto-hangup on call progress tones feature for the PSTN interface.

*   **Argument Value**: Boolean
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Default**: 0
*   **Event Source**: No

#### `pstn_country`
This parameter configures the PSTN interface for operation in a specific country.

*   **Argument Value**: List
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Event Source**: No
*   **Values**: `argentina`, `australia`, `austria`, `bahrain`, `belgium`, `brazil`, `bulgaria`, `canada`, `chile`, `china`, `colombia`, `croatia`, `cyprus`, `czech_republic`, `denmark`, `ecuador`, `egypt`, `el_salvador`, `finland`, `france`, `germany`, `greece`, `guam`, `hong_kong`, `hungary`, `iceland`, `india`, `indonesia`, `ireland`, `israel`, `italy`, `japan`, `jordan`, `kazakhstan`, `kuwait`, `latvia`, `lebanon`, `luxembourg`, `macao`, `malaysia`, `malta`, `mexico`, `morocco`, `netherlands`, `new_zealand`, `nigeria`, `norway`, `oman`, `pakistan`, `peru`, `philippines`, `poland`, `portugal`, `romania`, `russia`, `saudi_arabia`, `singapore`, `slovakia`, `slovenia`, `south_africa`, `south_korea`, `spain`, `sweden`, `switzerland`, `taiwan`, `tbr21`, `thailand`, `uae`, `united_kingdom`, `usa` (default), `yemen`

#### `pstn_dtmf_tone_duration`
This parameter controls the duration (in milliseconds) of the tone generated for each DTMF digit.

*   **Argument Value**: Integer
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: 10, Maximum: 600000
*   **Default**: 100
*   **Event Source**: No

#### `pstn_flash_delay_override`
Override Country Code Flash Delay.

*   **Argument Value**: Boolean
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Default**: 0
*   **Event Source**: No

#### `pstn_in_gain`
This parameter sets the gain (in dB) of the signal coming from the PSTN interface.

*   **Argument Value**: Floating-Point
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: -20.0, Maximum: 20.0, Resolution: 0.5
*   **Default**: 0.0
*   **Event Source**: No

#### `pstn_line_voltage`
This parameter indicates the line voltage (in Volts) of the PSTN interface.

*   **Argument Value**: Integer
*   **Read/Write Mode**: Read-Only
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: -128, Maximum: 128
*   **Event Source**: No

#### `pstn_loop_current`
This parameter indicates the loop current (in milliamps) of the PSTN interface.

*   **Argument Value**: Floating-Point
*   **Read/Write Mode**: Read-Only
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: 0.0, Maximum: 281.6, Resolution: 0.1
*   **Event Source**: No

#### `pstn_out_gain`
This parameter sets the gain (in dB) of the signal going to the PSTN interface.

*   **Argument Value**: Floating-Point
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: -20.0, Maximum: 20.0, Resolution: 0.5
*   **Default**: 0.0
*   **Event Source**: No

#### `voip_answer`
This parameter is used to answer an incoming call while the SoundStructure VoIP Interface is currently in a different call.

*   **Argument Value**: Void
*   **Read/Write Mode**: Write-Only
*   **Channel Type**: Virtual Channel
*   **Event Source**: No

#### `voip_blind`
This parameter is used along with `voip_transfer` to make a blind transfer.

*   **Argument Value**: Void
*   **Read/Write Mode**: Write-Only
*   **Channel Type**: Virtual Channel
*   **Event Source**: No

#### `voip_board_info`
This parameter returns manufacturing and hardware information about the VoIP plug-in card.

*   **Argument Value**: Void
*   **Read/Write Mode**: Read-Only
*   **Channel Type**: Virtual Channel
*   **System Limits**: Max String Length: 256
*   **Event Source**: No

#### `voip_bootblock_sw_ver`
Get Bootblock Software Version.

*   **Argument Value**: String
*   **Read/Write Mode**: Read-Only
*   **Channel Type**: Virtual Channel
*   **System Limits**: Max String Length: 256
*   **Event Source**: No

#### `voip_bootrom_sw_ver`
Get Bootrom Software Version.

*   **Argument Value**: String
*   **Read/Write Mode**: Read-Only
*   **Channel Type**: Virtual Channel
*   **System Limits**: Max String Length: 256
*   **Event Source**: No

#### `voip_call_appearance`
Select the Active Call Appearance.

*   **Argument Value**: Sequence
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: 1, Maximum: 24
*   **Default**: 1
*   **Event Source**: No

#### `voip_call_appearance_info`
Call Appearance Info.

*   **Argument Value**: String
*   **Read/Write Mode**: Read-Only
*   **Channel Type**: Virtual Channel
*   **Indices**: 1-24 (Call appearance index), 1-2 (Description line)
*   **System Limits**: Max String Length: 128
*   **Event Source**: No

#### `voip_call_appearance_line`
Call Appearance Line Number.

*   **Argument Value**: Integer
*   **Read/Write Mode**: Read-Only
*   **Channel Type**: Virtual Channel
*   **Indices**: 1-24 (Call appearance index)
*   **System Limits**: Minimum: 1, Maximum: 12
*   **Event Source**: No

#### `voip_call_appearance_state`
Call Appearance State.

*   **Argument Value**: List
*   **Read/Write Mode**: Read-Only
*   **Channel Type**: Virtual Channel
*   **Indices**: 1-24 (Call appearance index)
*   **Event Source**: No
*   **Values**: `free`, `dialtone`, `setup`, `overlap`, `proceeding`, `ringback`, `connected`, `disconnected`, `pre_offering`, `offering`, `ncas_call_transfer`, `ncas_call_conference`, `ncas_call_hold`, `ncas_call_held`, `ncas_call_conference_hold`, `pvc`, `preemption_in_progress`, `pre_dialtone`

#### `voip_cancel`
Cancel a Transfer or Conference.

*   **Argument Value**: Void
*   **Read/Write Mode**: Write-Only
*   **Channel Type**: Virtual Channel
*   **Event Source**: No

#### `voip_conference`
Start a Conference Call.

*   **Argument Value**: Void
*   **Read/Write Mode**: Write-Only
*   **Channel Type**: Virtual Channel
*   **Event Source**: No

#### `voip_dhcp_boot_serv`
Set Boot Server Option.

*   **Argument Value**: List
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Values**: `option66`, `custom`, `static` (default), `custom_opt66`
*   **Event Source**: No

#### `voip_dhcp_boot_serv_opt`
Set Boot Server Option Number.

*   **Argument Value**: Integer
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: 0, Maximum: 255
*   **Default**: 150
*   **Event Source**: No

#### `voip_dhcp_boot_serv_type`
Set Boot Server Option Type.

*   **Argument Value**: List
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Values**: `ip_address` (default), `string`
*   **Event Source**: No

#### `voip_dhcp_option_60_type`
Set Boot Server Option 60 Type.

*   **Argument Value**: List
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Values**: `rfc3925_binary` (default), `ascii_string`
*   **Event Source**: No

#### `voip_dial_mode`
Set Dial Mode.

*   **Argument Value**: List
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Values**: `number` (default), `url`
*   **Event Source**: No

#### `voip_dnd`
Enable or Disable Do-Not-Disturb Mode.

*   **Argument Value**: Boolean
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Default**: 0
*   **Event Source**: No

#### `voip_eth_settings`
VoIP Interface Ethernet Settings.

*   **Argument Value**: String
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Max String Length: 256
*   **Default**: "mode=dhcp"
*   **Event Source**: No

#### `voip_eth_vlan_id`
Set VLAN ID for the VoIP Interface.

*   **Argument Value**: Integer
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: -1, Maximum: 4096
*   **Default**: -1
*   **Event Source**: No

#### `voip_factory_reset`
Reset VoIP Interface to Factory State.

*   **Argument Value**: Void
*   **Read/Write Mode**: Write-Only
*   **Channel Type**: Virtual Channel
*   **Event Source**: No

#### `voip_forward`
Forward a Call.

*   **Argument Value**: Void
*   **Read/Write Mode**: Write-Only
*   **Channel Type**: Virtual Channel
*   **Event Source**: No

#### `voip_hold`
Place Current Call on Hold.

*   **Argument Value**: Void
*   **Read/Write Mode**: Write-Only
*   **Channel Type**: Virtual Channel
*   **Event Source**: No

#### `voip_join`
Add Call to a Conference.

*   **Argument Value**: Void
*   **Read/Write Mode**: Write-Only
*   **Channel Type**: Virtual Channel
*   **Event Source**: No

#### `voip_line`
Select the Active Line.

*   **Argument Value**: Sequence
*   **Read/Write Mode**: Write-Only
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: 1, Maximum: 12
*   **Event Source**: No

#### `voip_line_label`
Label for the Line Key.

*   **Argument Value**: String
*   **Read/Write Mode**: Read-Only
*   **Channel Type**: Virtual Channel
*   **Indices**: 1-12 (Line number)
*   **System Limits**: Max String Length: 128
*   **Event Source**: No

#### `voip_line_state`
State for the VoIP Line.

*   **Argument Value**: List
*   **Read/Write Mode**: Read-Only
*   **Channel Type**: Virtual Channel
*   **Event Source**: No
*   **Values**: `unregistered`, `reg_failed`, `registered`, `reg_in_progress`
*   **Indices**: 1-12 (Line number)
*   **Values**: `none`, `messages`, `do_not_disturb`, `line_not_registered`, `line_registered`, `in_conference`, `acd_active`, `call_on_hold`, `shared_line`, `speed_dial_indicator`, `forward_all_calls`, `acd_online`, `acd_not_logged_in`, `acd_available`, `remote_active`, `secure_rtp`, `remote_hold`, `hd_audio`, `offering`, `proceed`, `dial_tone`, `held`, `disconnect`, `feat_enabled`, `feat_disabled`, `cma_presence_available`, `cma_presence_busy`, `cma_presence_available_in_a_call`, `cma_presence_unavailable`, `cma_presence_away`, `cma_presence_offline`, `ocs_available`, `ocs_away`, `ocs_busy`, `ocs_do_not_disturb`, `ocs_no_info`, `ocs_offline`, `blf_busy`

#### `voip_local_reset`
Reset Local Configuration Parameters.

*   **Argument Value**: Void
*   **Read/Write Mode**: Write-Only
*   **Channel Type**: Virtual Channel
*   **Indices**: 1-12 (Line number)
*   **System Limits**: Max String Length: 128
*   **Event Source**: No

#### `voip_message_waiting`
Indicates Whether Messages are Waiting.

*   **Argument Value**: Boolean
*   **Read/Write Mode**: Read-Only
*   **Channel Type**: Virtual Channel
*   **Event Source**: Yes

#### `voip_net_cfg_save`
Save VoIP Network Settings.

*   **Argument Value**: Void
*   **Read/Write Mode**: Write-Only
*   **Channel Type**: Virtual Channel
*   **Event Source**: No

#### `voip_prov_serv_address`
Set Provisioning Server Address.

*   **Argument Value**: String
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Max String Length: 256
*   **Event Source**: No

#### `voip_prov_serv_password`
Set Provisioning Server Password.

*   **Argument Value**: String
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Max String Length: 256
*   **Event Source**: No

#### `voip_prov_serv_type`
Set Provisioning Server Type.

*   **Argument Value**: List
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Values**: `ftp` (default), `http`, `https`, `ftps`
*   **Event Source**: No

#### `voip_prov_serv_user`
Set Provisioning Server Username.

*   **Argument Value**: String
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Default**: 
*   **Event Source**: No

#### `voip_reboot`
Reboot VoIP Interface.

*   **Argument Value**: Void
*   **Read/Write Mode**: Write-Only
*   **Channel Type**: Virtual Channel
*   **Event Source**: No

#### `voip_resume`
Resume a Call That is On Hold.

*   **Argument Value**: Void
*   **Read/Write Mode**: Write-Only
*   **Channel Type**: Virtual Channel
*   **Event Source**: No

#### `voip_send`
Send Call that can't be Auto-dialed.

*   **Argument Value**: Void
*   **Read/Write Mode**: Write-Only
*   **Channel Type**: Virtual Channel
*   **Event Source**: No

#### `voip_split`
Add Call to a Conference.

*   **Argument Value**: Void
*   **Read/Write Mode**: Write-Only
*   **Channel Type**: Virtual Channel
*   **Event Source**: No

#### `voip_status`
Status of the VoIP Interface.

*   **Argument Value**: List
*   **Read/Write Mode**: Read-Only
*   **Channel Type**: Virtual Channel
*   **Values**: `booting`, `ok`, `flashing`
*   **Event Source**: No

#### `voip_transfer`
Transfer a Call.

*   **Argument Value**: Void
*   **Read/Write Mode**: Write-Only
*   **Channel Type**: Virtual Channel
*   **Event Source**: No

#### `voip_uc_sw_ver`
Get the UC Software Version.

*   **Argument Value**: String
*   **Read/Write Mode**: Read-Only
*   **Channel Type**: Virtual Channel
*   **System Limits**: Max String Length: 256
*   **Event Source**: No

### Equalizer Parameters

#### `eq_en`
Enable All Equalizer Processing.

*   **Argument Value**: Boolean
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Default**: 0
*   **Event Source**: No

#### `eq_type`
Select Graphic or Parametric Equalizer.

*   **Argument Value**: List
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Values**: `geq` (default), `peq`
*   **Event Source**: No

#### `geq_compensate`
Enable Gain Compensation For Graphic Equalizer.

*   **Argument Value**: Boolean
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Default**: 0
*   **Event Source**: No

#### `geq_en`
Enable Graphic Equalizer.

*   **Argument Value**: Boolean
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Default**: 0
*   **Event Source**: No

#### `geq_gain`
Gain of Graphic Equalizer Band.

*   **Argument Value**: Floating-Point
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Indices**: 1-31
*   **System Limits**: Minimum: -20.0, Maximum: 20.0, Resolution: 0.01
*   **Default**: 0.0
*   **Event Source**: No

#### `geq_type`
Graphic Equalizer Type.

*   **Argument Value**: List
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Values**: `1_octave` (10 band), `2/3_octave` (15 band), `1/3_octave` (31 band) (default)
*   **Event Source**: No

#### `high_shelf_en`
Enable High Shelving Filter.

*   **Argument Value**: Boolean
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Default**: 0
*   **Event Source**: No

#### `high_shelf_frequency`
Frequency Of High Shelving Filter.

*   **Argument Value**: Floating-Point
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: 20.0, Maximum: 20000.0, Resolution: 0.1
*   **Default**: 500.0
*   **Event Source**: No

#### `high_shelf_gain`
Gain Of High Shelving Filter.

*   **Argument Value**: Floating-Point
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: -20.0, Maximum: 20.0, Resolution: 0.01
*   **Default**: 0.0
*   **Event Source**: No

#### `high_shelf_slope`
Slope Of High Shelving Filter.

*   **Argument Value**: List
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Values**: `6_db_per_octave` (default), `12_db_per_octave`
*   **Event Source**: No

#### `horn_en`
Enable Horn Equalizer.

*   **Argument Value**: Boolean
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Default**: 0
*   **Event Source**: No

#### `horn_frequency`
Frequency of Horn Equalizer.

*   **Argument Value**: Floating-Point
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: 20.0, Maximum: 20000.0, Resolution: 0.1
*   **Default**: 4000.0
*   **Event Source**: No

#### `hpf_en`
Enable High-Pass Filter.

*   **Argument Value**: Boolean
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Default**: 0
*   **Event Source**: No

#### `hpf_frequency`
Frequency Of High-Pass Filter.

*   **Argument Value**: Floating-Point
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: 20.0, Maximum: 20000.0, Resolution: 0.1
*   **Default**: 160.0
*   **Event Source**: No

#### `hpf_order`
Order of High-Pass Filter.

*   **Argument Value**: Integer
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: 1, Maximum: 8
*   **Default**: 2
*   **Event Source**: No

#### `hpf_type`
Type Of High-Pass Filter.

*   **Argument Value**: List
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Values**: `butterworth` (default), `linkwitz_riley`
*   **Event Source**: No

#### `low_shelf_en`
Enable Low Shelving Filter.

*   **Argument Value**: Boolean
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Default**: 0
*   **Event Source**: No

#### `low_shelf_frequency`
Frequency Of Low Shelving Filter.

*   **Argument Value**: Floating-Point
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: 20.0, Maximum: 20000.0, Resolution: 0.1
*   **Default**: 500.0
*   **Event Source**: No

#### `low_shelf_gain`
Gain Of Low Shelving Filter.

*   **Argument Value**: Floating-Point
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: -20.0, Maximum: 20.0, Resolution: 0.01
*   **Default**: 0.0
*   **Event Source**: No

#### `low_shelf_slope`
Slope Of Low Shelving Filter.

*   **Argument Value**: List
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Values**: `6_db_per_octave` (default), `12_db_per_octave`
*   **Event Source**: No

#### `lpf_en`
Enable Low-Pass Filter.

*   **Argument Value**: Boolean
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Default**: 0
*   **Event Source**: No

#### `lpf_frequency`
Frequency Of Low-Pass Filter.

*   **Argument Value**: Floating-Point
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: 20.0, Maximum: 20000.0, Resolution: 0.1
*   **Default**: 16000.0
*   **Event Source**: No

#### `lpf_order`
Order Of Low-Pass Filter.

*   **Argument Value**: Integer
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: 1, Maximum: 8
*   **Default**: 2
*   **Event Source**: No

#### `lpf_type`
Type Of Low-Pass Filter.

*   **Argument Value**: List
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Values**: `butterworth` (default), `linkwitz_riley`
*   **Event Source**: No

#### `peq_band_en`
Enable Parametric Equalizer Band.

*   **Argument Value**: Boolean
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Indices**: 1-10
*   **Default**: 0
*   **Event Source**: No

#### `peq_bandwidth`
Bandwidth Of Parametric Equalizer Band.

*   **Argument Value**: Floating-Point
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Indices**: 1-10
*   **System Limits**: Minimum: 0.05, Maximum: 2.0, Resolution: 0.01
*   **Default**: 0.5
*   **Event Source**: No

#### `peq_frequency`
Frequency Of Parametric Equalizer Band.

*   **Argument Value**: Floating-Point
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Indices**: 1-10
*   **System Limits**: Minimum: 20.0, Maximum: 20000.0, Resolution: 0.1
*   **Default**: 1000.0
*   **Event Source**: No

#### `peq_gain`
Gain Of parametric Equalizer Band.

*   **Argument Value**: Floating-Point
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Indices**: 1-10
*   **System Limits**: Minimum: -20.0, Maximum: 20.0, Resolution: 0.01
*   **Default**: 0.0
*   **Event Source**: No

#### `peq_type`
Type Of parametric Equalizer Band.

*   **Argument Value**: List
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Indices**: 1-10
*   **Values**: `peaking` (default), `notch`, `allpass`
*   **Event Source**: No

### Dynamics Processing Parameters

#### `dp_en`
Enable Dynamics Processing.

*   **Argument Value**: Boolean
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Default**: 0
*   **Event Source**: No

#### `dp_gate_attack`
Gate Attack Time.

*   **Argument Value**: Integer
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: 1, Maximum: 200
*   **Default**: 1
*   **Event Source**: No

#### `dp_gate_decay`
Dynamics 'Gate' Decay Time.

*   **Argument Value**: Integer
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: 1, Maximum: 2000
*   **Default**: 1000
*   **Event Source**: No

#### `dp_gate_en`
Enable Gate.

*   **Argument Value**: Boolean
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Default**: 0
*   **Event Source**: No

#### `dp_gate_hold`
Gate Hold Time.

*   **Argument Value**: Integer
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: 1, Maximum: 2000
*   **Default**: 500
*   **Event Source**: No

#### `dp_gate_ratio`
Gate Ratio.

*   **Argument Value**: Floating-Point
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: 1.0, Maximum: 100.0, Resolution: 0.1
*   **Default**: 100.0
*   **Event Source**: No

#### `dp_gate_thresh`
Gate Threshold.

*   **Argument Value**: Floating-Point
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: -100.0, Maximum: 0.0, Resolution: 0.1
*   **Default**: -100
*   **Event Source**: No

#### `dp_exp_attack`
Expander Attack Time.

*   **Argument Value**: Integer
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: 1, Maximum: 200
*   **Default**: 10
*   **Event Source**: No

#### `dp_exp_decay`
Expander Decay Time.

*   **Argument Value**: Integer
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: 1, Maximum: 2000
*   **Default**: 100
*   **Event Source**: No

#### `dp_exp_en`
Enable Expander.

*   **Argument Value**: Boolean
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Default**: 0
*   **Event Source**: No

#### `dp_exp_ratio`
Expander Ratio.

*   **Argument Value**: Floating-Point
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: 1.0, Maximum: 100.0, Resolution: 0.1
*   **Default**: 2.0
*   **Event Source**: No

#### `dp_exp_thresh`
Expander Threshold.

*   **Argument Value**: Floating-Point
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: -100.0, Maximum: 0.0, Resolution: 0.1
*   **Default**: -100
*   **Event Source**: No

#### `dp_comp_attack`
Compressor Attack time.

*   **Argument Value**: Integer
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: 1, Maximum: 200
*   **Default**: 10
*   **Event Source**: No

#### `dp_comp_decay`
Compressor Decay Time.

*   **Argument Value**: Integer
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: 1, Maximum: 2000
*   **Default**: 100
*   **Event Source**: No

#### `dp_comp_en`
Enable Compressor.

*   **Argument Value**: Boolean
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Default**: 0
*   **Event Source**: No

#### `dp_comp_ratio`
Compressor Ratio.

*   **Argument Value**: Floating-Point
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: 1.0, Maximum: 100.0, Resolution: 0.1
*   **Default**: 2.0
*   **Event Source**: No

#### `dp_comp_thresh`
Compressor Threshold.

*   **Argument Value**: Floating-Point
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: -100.0, Maximum: 0.0, Resolution: 0.1
*   **Default**: 0.0
*   **Event Source**: No

#### `dp_lim_attack`
Limiter Attack Time.

*   **Argument Value**: Integer
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: 1, Maximum: 200
*   **Default**: 5
*   **Event Source**: No

#### `dp_lim_decay`
Limiter Decay Time.

*   **Argument Value**: Integer
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: 1, Maximum: 2000
*   **Default**: 500
*   **Event Source**: No

#### `dp_lim_en`
Enable Limiter.

*   **Argument Value**: Boolean
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Default**: 0
*   **Event Source**: No

#### `dp_lim_ratio`
Limiter Ratio.

*   **Argument Value**: Floating-Point
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: 1.0, Maximum: 100.0, Resolution: 0.1
*   **Default**: 10.0
*   **Event Source**: No

#### `dp_lim_thresh`
Limiter Threshold.

*   **Argument Value**: Floating-Point
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: -100.0, Maximum: 0.0, Resolution: 0.1
*   **Default**: 0.0
*   **Event Source**: No

#### `dp_peak_en`
Enable Peak Limiter.

*   **Argument Value**: Boolean
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Default**: 0
*   **Event Source**: No

#### `dp_peak_thresh`
Peak Limiter threshold.

*   **Argument Value**: Floating-Point
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: -100.0, Maximum: 0.0, Resolution: 0.1
*   **Default**: 0.0
*   **Event Source**: No

### Algorithm Parameters

#### `aec_en`
Acoustic Echo Canceller Enable.

*   **Argument Value**: Boolean
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Default**: 0
*   **Event Source**: No

#### `aec_noise_fill`
Enable Noise Fill.

*   **Argument Value**: Boolean
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Default**: 1
*   **Event Source**: No

#### `aec_ref`
AEC Reference.

*   **Argument Value**: String
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Indices**: 1-2
*   **System Limits**: Max String Length: 256
*   **Event Source**: No

#### `agc_en`
Automatic Gain Control Enable.

*   **Argument Value**: Boolean
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Default**: 0
*   **Event Source**: No

#### `agc_max_gain`
AGC Maximum Gain.

*   **Argument Value**: Floating-Point
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: 0.0, Maximum: 20.0, Resolution: 0.1
*   **Default**: 6.0
*   **Event Source**: No

#### `agc_min_gain`
AGC Minimum Gain.

*   **Argument Value**: Floating-Point
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: -20.0, Maximum: 0.0, Resolution: 0.1
*   **Default**: -6.0
*   **Event Source**: No

#### `delay`
Amount Of Delay.

*   **Argument Value**: Integer
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: 0, Maximum: 48000
*   **Default**: 0
*   **Event Source**: No

#### `delay_en`
Enable Signal Delay.

*   **Argument Value**: Boolean
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Default**: 0
*   **Event Source**: No

#### `fb_en`
Enable Feedback Reduction.

*   **Argument Value**: Boolean
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Default**: 0
*   **Event Source**: No

#### `fb_filter_bandwidth`
Feedback Reduction filter Bandwidth.

*   **Argument Value**: Floating-Point
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: 0.03, Maximum: 1.0, Resolution: 0.01
*   **Default**: 0.1
*   **Event Source**: No

#### `fb_filter_decay_en`
Enable Filter Decay Mode In Feedback Reduction Algorithm.

*   **Argument Value**: Boolean
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Default**: 0
*   **Event Source**: No

#### `fb_filter_reset`
Reset One Of The Feedback Reduction Filters.

*   **Argument Value**: Void
*   **Read/Write Mode**: Write-Only
*   **Channel Type**: Virtual Channel
*   **Indices**: 1-10
*   **Event Source**: No

#### `fb_filter_max_depth`
Maximum Filter Depth For Feedback Reduction Filters.

*   **Argument Value**: Floating-Point
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: -100.0, Maximum: 0.0, Resolution: 0.1
*   **Default**: -15.0
*   **Event Source**: No

#### `fb_safe_mode_atten`
Safe Mode Attenuation For Feedback Reduction.

*   **Argument Value**: Floating-Point
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: 0.0, Maximum: 100.0, Resolution: 0.1
*   **Default**: 3.0
*   **Event Source**: No

#### `mic_source_index`
Select Mic audio Source Index.

*   **Argument Value**: Sequence
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Indices**: 1-32
*   **System Limits**: Minimum: 1, Maximum: 15
*   **Default**: 1
*   **Event Source**: No

#### `mic_source_type`
Select Mic audio Source Type.

*   **Argument Value**: List
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Values**: `analog` (default), `clink_mic`
*   **Event Source**: No

#### `nc_en`
Enable Noise Canceller.

*   **Argument Value**: Boolean
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Default**: 0
*   **Event Source**: No

#### `nc_level`
Noise Cancellation Level.

*   **Argument Value**: Floating-Point
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: 0.0, Maximum: 20.0, Resolution: 1.0
*   **Default**: 10.0
*   **Event Source**: No

#### `sig_gen_gain`
Signal Generator Gain.

*   **Argument Value**: Floating-Point
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: -100.0, Maximum: 20.0, Resolution: 0.1
*   **Default**: -30.0
*   **Event Source**: No

#### `sig_gen_sweep_start`
Signal Generator Sweep Start Frequency.

*   **Argument Value**: Floating-Point
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: 20.0, Maximum: 20000.0, Resolution: 0.1
*   **Default**: 20.0
*   **Event Source**: No

#### `sig_gen_sweep_step`
Signal Generator Sweep Step Size.

*   **Argument Value**: List
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Values**: `continuous` (default), `1/24_octave`, `1/12_octave`, `1/6_octave`, `1/3_octave`, `1_octave`
*   **Event Source**: No

#### `sig_gen_sweep_stop`
Signal Generator Sweep Stop Frequency.

*   **Argument Value**: Floating-Point
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: 20.0, Maximum: 20000.0, Resolution: 0.1
*   **Default**: 20000.0
*   **Event Source**: No

#### `sig_gen_sweep_time`
Signal Generator Sweep Time.

*   **Argument Value**: Integer
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: 10, Maximum: 60000
*   **Default**: 10000
*   **Event Source**: No

#### `sig_gen_tone_freq`
Signal Generator Tone Frequency.

*   **Argument Value**: Floating-Point
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: 20.0, Maximum: 20000.0, Resolution: 0.1
*   **Default**: 1000.0
*   **Event Source**: No

#### `sig_gen_type`
This parameter sets the type of signal produced by the signal generator.

*   **Argument Value**: List
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Values**: `pink`, `white`, `sine`, `sweep`
*   **Event Source**: No

### Input Path Parameters

#### `cr_ungated_type`
This parameter selects the version of signal to use for the ungated triune signal of the specified virtual channel.

*   **Argument Value**: List
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Values**: `conf`, `sr`, `line`, `bypass`
*   **Event Source**: No

#### `sr_delay_type`
This parameter selects the version of signal to use for the sound reinforcement triune signal of the specified virtual channel.

*   **Argument Value**: List
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Values**: `normal`, `low_delay`
*   **Event Source**: No

#### `sr_ungated_type`
This parameter selects the version of signal to use for the ungated triune signal of the specified virtual channel.

*   **Argument Value**: List
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Values**: `rec`, `sr`, `line`, `bypass`
*   **Event Source**: No

#### `ungated_delay_comp_en`
Delay compensation only applies to the ungated signal, and only when it is using the line or bypass options.

*   **Argument Value**: Boolean
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Default**: 0
*   **Event Source**: No

### Automixer Parameters

#### `am_adapt_thresh`
This parameter defines how much louder (in dB) the microphone's signal level must be above its measured noise floor before its considered active.

*   **Argument Value**: Floating-Point
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: 0.0, Maximum: 100.0, Resolution: 0.1
*   **Default**: 10.0
*   **Event Source**: No

#### `am_camera_activity_time`
This parameter defines the amount of time (in ms) a signal must be active before showing up on the camera activity meter.

*   **Argument Value**: Integer
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Global System
*   **Indices**: 1-63
*   **System Limits**: Minimum: 10, Maximum: 10000
*   **Default**: 2000
*   **Event Source**: No

#### `am_chairman`
When this parameter is set to 1, the microphone is considered a chairman microphone.

*   **Argument Value**: Boolean
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Default**: 0
*   **Event Source**: No

#### `am_chan_bias`
This parameter sets the channel bias (in dB) for the associated microphone.

*   **Argument Value**: Floating-Point
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: -20.0, Maximum: 20.0, Resolution: 0.1
*   **Default**: 0.0
*   **Event Source**: No

#### `am_decay_time`
This parameter defines how long (in ms) the gain of a gated microphone in the specified automixer group takes to transition between fully open and its off attenuation value when it is time for the microphone to gate off.

*   **Argument Value**: Integer
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Global System
*   **Indices**: 1-63
*   **System Limits**: Minimum: 10, Maximum: 10000
*   **Default**: 1000
*   **Event Source**: No

#### `am_en`
This parameter enables or disables the automixer for the virtual channel.

*   **Argument Value**: Boolean
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Default**: 0
*   **Event Source**: No

#### `am_gain_sharing`
This parameter selects gain-sharing mode for the specified automixer group when set to 1.

*   **Argument Value**: Boolean
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Global System
*   **Indices**: 1-63
*   **Default**: 0
*   **Event Source**: No

#### `am_group`
This parameter selects the automixer group in which the microphone is a member.

*   **Argument Value**: Sequence
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: 1, Maximum: 63
*   **Default**: 1
*   **Event Source**: No

#### `am_hold_time`
This parameter defines how long (in ms) the microphone in the specified automixer group will be considered active after the last detected significant level on the microphone.

*   **Argument Value**: Integer
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Global System
*   **Indices**: 1-63
*   **System Limits**: Minimum: 100, Maximum: 10000
*   **Default**: 500
*   **Event Source**: No

#### `am_last_mic_mode`
When this parameter is set to 1, the last mic mode is enabled on the microphone.

*   **Argument Value**: Boolean
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Default**: 0
*   **Event Source**: No

#### `am_nom_limit`
This parameter sets the NOM limit for the microphone with respect to its automixer group.

*   **Argument Value**: Integer
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Global System
*   **Indices**: 1-63
*   **System Limits**: Minimum: 0, Maximum: 128
*   **Default**: 16
*   **Event Source**: No

#### `am_off_atten`
This parameter defines how much attenuation (in dB) is applied to a gated microphone in the specified group when the microphone is fully gated off.

*   **Argument Value**: Floating-Point
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Global System
*   **Indices**: 1-63
*   **System Limits**: Minimum: 0.0, Maximum: 100.0, Resolution: 0.1
*   **Default**: 15.0
*   **Event Source**: No

#### `am_priority`
This parameter sets the priority of the microphone.

*   **Argument Value**: Integer
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: 1, Maximum: 4
*   **Default**: 1
*   **Event Source**: No

#### `am_priority_atten`
This parameter sets the amount of attenuation (in dB) that is applied to the microphones in the specified automixer group if a higher priority microphone in the group is currently active.

*   **Argument Value**: Floating-Point
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Global System
*   **Indices**: 1-63
*   **System Limits**: Minimum: 0.0, Maximum: 100.0, Resolution: 0.1
*   **Default**: 0.0
*   **Event Source**: No

#### `am_slope`
This parameter defines how much attenuation (in dB) is applied to microphones in the specified automixer group when they don't have the highest level in the group.

*   **Argument Value**: Floating-Point
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Global System
*   **Indices**: 1-63
*   **System Limits**: Minimum: 0.0, Maximum: 10.0, Resolution: 0.1
*   **Default**: 2.0
*   **Event Source**: No

### GPIO Control Parameters

#### `analog_gpio_value`
This parameter gets or sets the value of the analog gpio pin.

*   **Argument Value**: Integer
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: 0, Maximum: 255
*   **Default**: 0
*   **Event Source**: Yes

#### `digital_gpio_held`
This parameter indicates when a digital input pin is held.

*   **Argument Value**: Boolean
*   **Read/Write Mode**: Read-Only
*   **Channel Type**: Virtual Channel
*   **Event Source**: Yes

#### `digital_gpio_hold_time`
This parameter specifies the amount of time (in milliseconds) that a GPIO pin must be held for the digital_gpio_held status message to be sent.

*   **Argument Value**: Integer
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: 0, Maximum: 10000
*   **Default**: 0
*   **Event Source**: No

#### `digital_gpio_repeat_time`
This parameter specifies the amount of time (in milliseconds) between digital_gpio_held status messages when a GPIO pin is continually held.

*   **Argument Value**: Integer
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: 1, Maximum: 10000
*   **Default**: 1000
*   **Event Source**: No

#### `digital_gpio_state`
This parameter gets or sets the value of the digital gpio pin.

*   **Argument Value**: Boolean
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **Default**: 0
*   **Event Source**: Yes

#### `digital_gpio_value`
This parameter gets or sets the value of the digital gpio array.

*   **Argument Value**: Integer
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: 0, Maximum: 2147483647
*   **Default**: 0
*   **Event Source**: Yes

### Control Port Parameters

#### `clink_call_active`
This parameter gets the call active status of an HDX.

*   **Argument Value**: Boolean
*   **Read/Write Mode**: Read-Only
*   **Channel Type**: Device-Specific System
*   **Event Source**: Yes

#### `clink_local_call_active`
This parameter gets or sets the call active status that the device broadcasts to any connected HDX and HDX Microphone Arrays.

*   **Argument Value**: Integer
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Device-Specific System
*   **System Limits**: Minimum: 0, Maximum: 32
*   **Default**: 0
*   **Event Source**: Yes

#### `clink_mute`
This parameter gets or sets the mute status of an HDX or HDX Microphone Array attached to the indicated device.

*   **Argument Value**: Boolean
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Device-Specific System
*   **Default**: 0
*   **Event Source**: Yes

#### `clink_volume`
This parameter gets or sets the volume status of an HDX.

*   **Argument Value**: Integer
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Device-Specific System
*   **System Limits**: Minimum: 0, Maximum: 51
*   **Default**: 31
*   **Event Source**: Yes

#### `eth_settings`
This parameter gets or sets the Ethernet settings.

*   **Argument Value**: String
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Device-Specific System
*   **System Limits**: Max String Length: 256
*   **Default**: "mode=dhcp"
*   **Event Source**: No

#### `eth_mac`
This parameter gets the MAC address for the system's Ethernet port.

*   **Argument Value**: String
*   **Read/Write Mode**: Read-Only
*   **Channel Type**: Device-Specific System
*   **System Limits**: Max String Length: 17
*   **Event Source**: No

#### `ir_key_press`
When queried, this parameter returns the keycode value of the last key that was pressed on the IR remote.

*   **Argument Value**: Integer
*   **Read/Write Mode**: Read-Only
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: 0, Maximum: 255
*   **Event Source**: No

#### `ir_key_held`
When queried, this parameter returns the keycode value of the last key that was held on the IR remote.

*   **Argument Value**: Integer
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: 0, Maximum: 255
*   **Event Source**: No

#### `ir_chan_id`
This parameter sets the channel ID that the specified IR input will respond to.

*   **Argument Value**: Integer
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Virtual Channel
*   **System Limits**: Minimum: 0, Maximum: 15
*   **Default**: 3
*   **Event Source**: No

#### `ser_baud`
This parameter sets the baud rate for the RS-232 port.

*   **Argument Value**: List
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Device-Specific System
*   **Values**: `9600`, `19200`, `38400`, `57600`, `115200`
*   **Event Source**: No

#### `ser_control_mode`
This parameter sets the mode of operation for the RS-232 port.

*   **Argument Value**: List
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Device-Specific System
*   **Values**: `command`, `broadcast`
*   **Event Source**: No

#### `ser_flow`
This parameter sets the type of flow control that will be used on the RS-232 port.

*   **Argument Value**: List
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Device-Specific System
*   **Values**: `none`, `hw`
*   **Event Source**: No

#### `ser_send`
This parameter is used to broadcast arbitrary commands to equipment attached to the RS-232 port.

*   **Argument Value**: String
*   **Read/Write Mode**: Read-Only
*   **Channel Type**: Device-Specific System
*   **System Limits**: Max String Length: 256
*   **Event Source**: No

### System Parameters

#### `dev_bootloader_ver`
This parameter returns the bootloader version.

*   **Argument Value**: String
*   **Read/Write Mode**: Read-Only
*   **Channel Type**: Device-Specific System
*   **System Limits**: Max String Length: 24
*   **Event Source**: No

#### `dev_firmware_ver`
This parameter returns the device's firmware version.

*   **Argument Value**: String
*   **Read/Write Mode**: Read-Only
*   **Channel Type**: Device-Specific System
*   **System Limits**: Max String Length: 24
*   **Event Source**: No

#### `dev_hw_eco`
This parameter returns the hardware ECO number for the board.

*   **Argument Value**: Integer
*   **Read/Write Mode**: Read-Only
*   **Channel Type**: Device-Specific System
*   **System Limits**: Minimum: 0, Maximum: 255
*   **Event Source**: No

#### `dev_hw_rev`
This parameter returns the hardware revision of the device.

*   **Argument Value**: String
*   **Read/Write Mode**: Read-Only
*   **Channel Type**: Device-Specific System
*   **System Limits**: Max String Length: 32
*   **Event Source**: No

#### `dev_led_cycle`
This parameter causes the front panel LED of the specified device to cycle through its colors.

*   **Argument Value**: Integer
*   **Read/Write Mode**: Write-Only
*   **Channel Type**: Device-Specific System
*   **System Limits**: Minimum: 1, Maximum: 60
*   **Event Source**: No

#### `dev_ntp_server`
This parameter gets or sets the name of the network time protocol (NTP) server used to set the system time.

*   **Argument Value**: String
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Device-Specific System
*   **System Limits**: Max String Length: 32
*   **Default**: "pool.ntp.org"
*   **Event Source**: No

#### `dev_status`
This parameter returns the status of the system.

*   **Argument Value**: List
*   **Read/Write Mode**: Read-Only
*   **Channel Type**: Device-Specific System
*   **Values**: `ok`, `warning`, `error`
*   **Event Source**: No

#### `dev_temp`
This parameter returns the temperature (in degrees C) from one of the internal temperature sensors.

*   **Argument Value**: Floating-Point
*   **Read/Write Mode**: Read-Only
*   **Channel Type**: Device-Specific System
*   **Indices**: 1-3
*   **System Limits**: Minimum: -40.0, Maximum: 125.0, Resolution: 0.1
*   **Event Source**: No

#### `dev_temp_status`
This parameter returns the temperature status of the specified device.

*   **Argument Value**: List
*   **Read/Write Mode**: Read-Only
*   **Channel Type**: Device-Specific System
*   **Values**: `ok`, `warning`, `error`
*   **Event Source**: Yes

#### `dev_type`
This parameter returns the type of the device.

*   **Argument Value**: List
*   **Read/Write Mode**: Read-Only
*   **Channel Type**: Device-Specific System
*   **Values**: `c16`, `c12`, `c8`, `sr16`, `sr12`, `sr8`
*   **Event Source**: No

#### `dev_uptime`
This parameter returns the amount of time since the last reboot.

*   **Argument Value**: String
*   **Read/Write Mode**: Read-Only
*   **Channel Type**: Device-Specific System
*   **System Limits**: Max String Length: 16
*   **Event Source**: No

#### `dev_volt_clink`
This parameter returns the voltage (in Volts) of the ConferenceLink power supply.

*   **Argument Value**: Floating-Point
*   **Read/Write Mode**: Read-Only
*   **Channel Type**: Device-Specific System
*   **System Limits**: Minimum: 0.0, Maximum: 50.5, Resolution: 0.1
*   **Event Source**: No

#### `dev_volt_neg_15`
This parameter returns the voltage (in Volts) of the -15 V power supply.

*   **Argument Value**: Floating-Point
*   **Read/Write Mode**: Read-Only
*   **Channel Type**: Device-Specific System
*   **System Limits**: Minimum: -14.8, Maximum: 0.0, Resolution: 0.1
*   **Event Source**: No

#### `dev_volt_phantom`
This parameter returns the output voltage (in Volts) of the specified phantom power supply.

*   **Argument Value**: Floating-Point
*   **Read/Write Mode**: Read-Only
*   **Channel Type**: Device-Specific System
*   **Indices**: 1-4
*   **System Limits**: Minimum: 0.0, Maximum: 50.5, Resolution: 0.1
*   **Event Source**: No

#### `dev_volt_pos_15`
This parameter returns the voltage (in Volts) of the +15 V power supply.

*   **Argument Value**: Floating-Point
*   **Read/Write Mode**: Read-Only
*   **Channel Type**: Device-Specific System
*   **System Limits**: Minimum: 0.0, Maximum: 14.8, Resolution: 0.1
*   **Event Source**: No

#### `sys_cmd_log_en`
This parameter controls whether commands and acknowledgements are reported in the system logs.

*   **Argument Value**: Boolean
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Global System
*   **Default**: 1
*   **Event Source**: No

#### `sys_factory_reset`
This parameter restores the device to its factory settings, erasing all user data but retaining the current version of firmware.

*   **Argument Value**: Void
*   **Read/Write Mode**: Write-Only
*   **Channel Type**: Global System
*   **Event Source**: No

#### `sys_last_full_preset`
This parameter returns the name of the last executed full preset.

*   **Argument Value**: String
*   **Read/Write Mode**: Read-Only
*   **Channel Type**: Global System
*   **Event Source**: No

#### `sys_last_partial_preset`
This parameter returns the name of the last executed partial preset.

*   **Argument Value**: String
*   **Read/Write Mode**: Read-Only
*   **Channel Type**: Global System
*   **Event Source**: No

#### `sys_last_preset`
This parameter returns the name of the last executed preset (either partial or full).

*   **Argument Value**: String
*   **Read/Write Mode**: Read-Only
*   **Channel Type**: Global System
*   **Event Source**: No

#### `sys_mtrreg_log_en`
This parameter controls whether mtrreg and mtrunreg commands and acknowledgements are reported in the system logs.

*   **Argument Value**: Boolean
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Global.
*   **Default**: 1
*   **Event Source**: No

#### `sys_name`
This parameter sets the name of the system.

*   **Argument Value**: String
*   **Read/Write Mode**: Read/Write
*   **Channel Type**: Global System
*   **System Limits**: Max String Length: 256
*   **Default**: "SoundStructure System"
*   **Event Source**: No

#### `sys_pause`
This parameter pauses system execution for the specified number of milliseconds.

*   **Argument Value**: Integer
*   **Read/Write Mode**: Write-Only
*   **Channel Type**: Global System
*   **System Limits**: Minimum: 1, Maximum: 5000
*   **Event Source**: No

#### `sys_reboot`
Setting this parameter causes all linked devices to reboot as if a power-cycle has occurred.

*   **Argument Value**: Void
*   **Read/Write Mode**: Write-Only
*   **Channel Type**: Global System
*   **Event Source**: No