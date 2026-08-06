---
origin: "[[Ref/Origin/Irish|Irish]]"
---

## Repertoire

```dataview
TABLE WITHOUT ID
file.link AS Tune, type AS Type, key AS Key
FROM "Repertoire/Tunes"
WHERE contains(composer, this.file.link) AND learn = false
SORT file.name ASC
```


## To Learn

```dataview
TABLE WITHOUT ID
file.link AS Tune, type AS Type, key AS Key
FROM "Repertoire/Tunes"
WHERE contains(composer, this.file.link) AND learn = true
SORT file.name ASC
```

...
