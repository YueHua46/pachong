## 爬取wallpaperflare.com图片

> npm run crawl -s [search] -c [count]

## 默认走7890端口

默认必须启动7890端口走代理
否则在wallpaperflare.com.ts中删除以下内容：
```ts
      proxy: {
        urls: ["http://127.0.0.1:7890"],
        switchByErrorCount: 5,
        switchByHttpStatus: [403, 404, 500, 502, 503, 504],
      },
```