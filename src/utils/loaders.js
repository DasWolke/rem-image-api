const {promisifyAll} = require('tsubaki')
const fs = promisifyAll(require('fs'))
const path = require('path')

module.exports.loadAuthProvider = async function loadAuthProvider (config) {
  const dir = await fs.readdirAsync(path.join(__dirname, '../', '/provider/auth'))
  console.log(dir)
  let authProvider
  if (dir.length > 0) {
    const classes = []
    for (let i = 0; i < dir.length; i++) {
      if (!dir[i].toLowerCase()
          .startsWith('base')) {
        classes.push(require(path.join(__dirname, '../', '/provider/auth', dir[i])))
      }
    }
    for (let i = 0; i < classes.length; i++) {
      if (classes[i].getId() === config.provider.auth.id) {
        authProvider = new classes[i](config.provider.auth)
      }
    }
  }
  return authProvider
}

module.exports.loadStorageProvider = async function loadStorageProvider (config) {
  const dir = await fs.readdirAsync(path.join(__dirname, '../', '/provider/storage'))
  let storageProvider
  if (dir.length > 0) {
    const classes = []
    for (let i = 0; i < dir.length; i++) {
      if (!dir[i].toLowerCase()
          .startsWith('base')) {
        classes.push(require(path.join(__dirname, '../', '/provider/storage', dir[i])))
      }
    }
    for (let i = 0; i < classes.length; i++) {
      if (classes[i].getId() === config.provider.storage.id) {
        storageProvider = new classes[i](config.provider.storage)
      }
    }
  }
  return storageProvider
}
