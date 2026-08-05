


## Repertoire

```dataview
TABLE WITHOUT ID
file.link AS Tune, type AS Type, origin AS Origin
FROM "Repertoire/Tunes"
WHERE contains(mode, this.file.link) AND learn = false
SORT file.name ASC
```

## To Learn

```dataview
TABLE WITHOUT ID
file.link AS Tune, type AS Type, origin AS Origin
FROM "Repertoire/Tunes"
WHERE contains(mode, this.file.link) AND learn = true
SORT file.name ASC
```

...
