module.exports.isTrue = function isTrue (value) {
  if (typeof value === 'string') {
    return value === 'true'
  } else if (typeof value === 'boolean') {
    return value
  } else {
    return false
  }
}
