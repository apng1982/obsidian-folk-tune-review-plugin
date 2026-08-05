For tunes/sets that are known pretty much everywhere!

...

## Sets

```dataview
TABLE WITHOUT ID
file.link AS Set, Whistle, Awesomeness AS 😎
FROM "Repertoire/Sets"
WHERE contains(Sessions, this.file.link)
SORT Awesomeness DESC
```

---

## Tunes
### Repertoire

```dataview
TABLE WITHOUT ID
file.link AS Tune, type AS Type, key AS Key, origin AS Origin
FROM "Repertoire/Tunes"
WHERE contains(sessions, this.file.link) AND learn = false
SORT learned DESC
```

### To Learn

```dataview
TABLE WITHOUT ID
file.link AS Tune, type AS Type, key AS Key, origin AS Origin
FROM "Repertoire/Tunes"
WHERE contains(sessions, this.file.link) AND learn = true
SORT learned DESC
```

...