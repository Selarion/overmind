---
created_at: <% tp.date.now("YYYY-MM-DD",) %>
updated_at: <% tp.date.now("YYYY-MM-DD",) %>
aliases: []
author: [[Толстов.М.В]]
title: <% tp.file.title %>
---

<% await tp.file.include("[[ap]]") %>

<% await tp.file.include("[[footer]]") %>
