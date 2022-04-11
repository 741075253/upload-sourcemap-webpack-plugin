const fs = require('fs');
const http = require('http');
const glob = require('glob');
const path = require('path');

class UploadSourceMapWebpackPlugin {
  constructor(options) {
    this.options = Object.assign(
      {
        delete: true,
      },
      options,
    );
  }
  apply(compiler) {
    console.log('UploadSourceMapWebPackPlugin apply');
    // 定义在打包后执行
    compiler.hooks.done.tap('upload-sourecemap-plugin', async status => {
      // 读取sourcemap文件
      const list = glob.sync(path.join(status.compilation.outputOptions.path, `./**/*.{js.map,}`));
      for (let filename of list) {
        await this.upload(this.options.uploadUrl, filename);
        if (this.options.delete) {
          this.deleteFile(filename);
        }
      }
    });
  }
  upload(url, file) {
    return new Promise(resolve => {
      console.log('uploadMap:', file);

      const req = http.request(`${url}?filename=${path.basename(file)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          Connection: 'keep-alive',
          'Transfer-Encoding': 'chunked',
        },
      });
      fs.createReadStream(file)
        .on('data', chunk => {
          req.write(chunk);
        })
        .on('end', () => {
          req.end();
          resolve();
        });
    });
  }
  deleteFile(file) {
    fs.rmSync(file);
  }
}

module.exports = UploadSourceMapWebpackPlugin;
