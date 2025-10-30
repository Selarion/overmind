---
created_at: 2025-10-29
updated_at: 2025-10-29
aliases: []
author: [[Зверев М.Ю.]]
tags: [_]
title: <% tp.file.title %>
---
up:: [[<% tp.file.cursor() %>]]



---
См. также
```dataview
list WHERE contains(file.outlinks, this.file.link)
AND !contains(this.file.outlinks, file.link)
```
