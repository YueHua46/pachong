// 1. 导入x-crawl模块
import xCrawl from 'x-crawl'
import { program } from 'commander'

// 定义命令行参数
program.option('-s, --search <keyword>', 'search keyword', 'rem')
program.option('-c, --count <number>', 'count of images', '10')
// 如果没有传递参数则使用默认参数
program.parse(process.argv)
const options = program.opts()
console.log('options', options)
const search = options.search
const dlCount = options.count


// 2. 创建爬虫实例
const myXCrawl = xCrawl({ maxRetry: 3, intervalTime: { max: 2000, min: 100 } })

// 3. 设置爬虫任务
/*
  调用 startPolling API 开始轮询功能，
  回调函数将每隔一天被调用一次
*/
myXCrawl.startPolling({ d: 1 }, async (count, stopPolling) => {
  // 调用crawlPage接口抓取页面
  const pageResults = await myXCrawl.crawlPage({
    targets: [`https://www.wallpaperflare.com/search?wallpaper=${search}`],
    viewport: { width: 1920, height: 1080 },
  })

  // 通过遍历爬取的页面结果获取图片URL
  const imgUrls: string[] = []
  for (const item of pageResults) {
    const { page } = item.data
    const elSelector = `#gallery a[itemprop="url"]`
    // 等待页面元素出现
    await page.waitForSelector(elSelector)

    // 获取页面图片的URL
    const urls = await page.$$eval(elSelector, (imgAel) => {
      return imgAel.map((item) => item.getAttribute('href'))
    })

    // 给这些所有的图片url添加download path后缀
    urls.slice(0, dlCount).forEach((item) => {
      imgUrls.push(`${item}/download`)
    })

    console.log('imgUrls', imgUrls)

    // 关闭页面（防止内存泄露）
    page.close()
  }

  // 再次爬取每一个图片URL
  const imgResults = await myXCrawl.crawlPage({
    targets: imgUrls,
    viewport: { width: 1920, height: 1080 }
  })

  const imgData: string[] = []

  for (let item of imgResults) {
    const { data } = item;
    const { page } = data;

    // 等待指定图片展示完毕
    await page.waitForSelector(`#show_img`)

    // 爬取图片资源
    const res = await page.$eval(`#show_img`, (imgEl => {
      return imgEl.getAttribute('src')
    }))
    imgData.push(res as string)

    console.log('imgData', imgData)

    // 关闭页面（防止内存泄露）
    page.close()
  }

  // 使用x-crawl的crawlFile API下载图片并保存到github仓库
  myXCrawl
    .crawlFile({
      targets: imgData,
      fileNames: imgData.map((item, index) => `${search}-${index}`),
      storeDirs: './upload',
      intervalTime: { max: 3000, min: 100 },
      maxRetry: 1,
      proxy: {
        urls: ["http://127.0.0.1:7890"],
        switchByErrorCount: 5,
        switchByHttpStatus: [403, 404, 500, 502, 503, 504],
      },
      // 为此次的目标统一设置指纹
      fingerprints: [
        // 设备指纹 1
        {
          platform: 'Windows',
          mobile: 'random',
          userAgent: {
            value:
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
            versions: [
              {
                name: 'Chrome',
                // 浏览器版本
                maxMajorVersion: 112,
                minMajorVersion: 100,
                maxMinorVersion: 20,
                maxPatchVersion: 5000
              },
              {
                name: 'Safari',
                maxMajorVersion: 537,
                minMajorVersion: 500,
                maxMinorVersion: 36,
                maxPatchVersion: 5000
              }
            ]
          }
        },
        // 设备指纹 2
        {
          platform: 'Windows',
          mobile: 'random',
          userAgent: {
            value:
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
            versions: [
              {
                name: 'Chrome',
                maxMajorVersion: 91,
                minMajorVersion: 88,
                maxMinorVersion: 10,
                maxPatchVersion: 5615
              },
              { name: 'Safari', maxMinorVersion: 36, maxPatchVersion: 2333 },
              { name: 'Edg', maxMinorVersion: 10, maxPatchVersion: 864 }
            ]
          }
        },
        // 设备指纹 3
        {
          platform: 'Windows',
          mobile: 'random',
          userAgent: {
            value:
              'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:47.0) Gecko/20100101 Firefox/47.0',
            versions: [
              {
                name: 'Firefox',
                maxMajorVersion: 47,
                minMajorVersion: 43,
                maxMinorVersion: 10,
                maxPatchVersion: 5000
              }
            ]
          }
        }
      ]
    })

})