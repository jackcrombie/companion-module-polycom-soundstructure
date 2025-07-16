function sanitize(label) {
	return label.replace(/[^a-zA-Z0-9_]/g, '_')
}

module.exports = {
	sanitize,
}
