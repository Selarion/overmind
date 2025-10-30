---
См. также
```dataview
list WHERE contains(file.outlinks, this.file.link)
AND !contains(this.file.outlinks, file.link)
```