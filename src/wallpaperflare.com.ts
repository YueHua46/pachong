// 1. 导入x-crawl模块
import xCrawl from 'x-crawl'

// 2. 创建爬虫实例
const myXCrawl = xCrawl({ maxRetry: 3, intervalTime: { max: 2000, min: 1000 } })

// 3. 设置爬虫任务
/*
  调用 startPolling API 开始轮询功能，
  回调函数将每隔一天被调用一次
*/
myXCrawl.startPolling({ d: 1 }, async (count, stopPolling) => {
  // 调用crawlPage接口抓取页面
  const pageResults = await myXCrawl.crawlPage({
    targets: ['https://www.wallpaperflare.com/search?wallpaper=rem'],
    viewport: { width: 1920, height: 1080 }
  })

  // 通过遍历爬取的页面结果获取图片URL
  const imgUrls: string[] = []
  for (const item of pageResults) {
    const { page } = item.data
    const elSelector = `#gallery a[itemprop="url"]`
    // 等待页面元素出现
    await page.waitForSelector(elSelector)

    // 获取页面图片的URL
    console.log('page', page)
    // 通过检索拥有itemtype属性的元素并且值为http://schema.org/ImageObject的元素获取图片URL

    const urls = await page.$$eval(elSelector, (imgAel) => {
      console.log('imgAel', imgAel)
      // return imgUl.map((item) => item)
      return imgAel.map((item) => item.getAttribute('href'))
    })
    console.log('urls', urls)
    // 给这些所有的图片url添加download path后缀
    urls.forEach((item) => {
      imgUrls.push(`${item}/download`)
    })

    // 关闭页面
    page.close()
  }

  // 再次爬取每一个图片URL
  const imgResults = await myXCrawl.crawlPage({
    targets: imgUrls.slice(0,10),// 只爬取前10张图片
    viewport: { width: 1920, height: 1080 }
  })

  const imgData:string[] = []

  for (let item of imgResults) {
    const { data } = item;
    const {page} = data;
    
    // 等待指定图片展示完毕
    await page.waitForSelector(`#show_img`)

    // 爬取图片资源
    await page.$eval(`#show_img`,(imgEl => {
      console.log('imgEl',imgEl);
      return imgEl.getAttribute('src')
    })).then((res) => {
      imgData.push(res as string)
    })
  
    // 关闭页面
    page.close()
  }

  // 使用x-crawl的crawlFile API下载图片并保存到github仓库
  myXCrawl
  .crawlFile({
    targets: imgData,
    storeDirs: './upload',
    intervalTime: { max: 3000, min: 1000 },
    maxRetry: 1
  })
  .then((res) => {})
})