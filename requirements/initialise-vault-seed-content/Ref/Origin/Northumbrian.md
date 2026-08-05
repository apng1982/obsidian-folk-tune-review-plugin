
## Sets

```dataview
TABLE WITHOUT ID
file.link AS Set, Whistle, Awesomeness AS 😎
FROM "Repertoire/Sets"
WHERE contains(origin, this.file.link)
SORT Awesomeness DESC
```

## Tunes
### Repertoire

```dataview
TABLE WITHOUT ID
file.link AS Tune, type AS Type, key AS Key
FROM "Repertoire/Tunes"
WHERE contains(origin, this.file.link) AND learn = false
SORT file.name DESC
```


### To Learn

```dataview
TABLE WITHOUT ID
file.link AS Tune, type AS Type, key AS Key
FROM "Repertoire/Tunes"
WHERE contains(origin, this.file.link) AND learn = true
SORT file.name DESC
```

...