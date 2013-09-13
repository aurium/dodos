Dodos — Escaping from Extinction
================================

A WebGame created to the http://js13kgames.com

User defined Levels
-------------------

You can create new levels to play adding parameters to the page URL, like this:
http://aurium.github.io/dodos?level=30,5,-50,100|water,500,-10,300,100|exit,650,350,120&name=Try%20it&time=600

### Level parameters

**level** - The only mandatory parameter to play your level. That will configure the game area.
* The `level` separates the stage things by pipes (`|`). The only two mandatory are the first (dodos config) and an `exit`.
* The `dodos config` are expressed as: `num-of-dodos,minimum-to-save,enter-x,enter-y`.
* All things are expressed as: `type-name,x,y,width,height`, except to the exit where `width,height` are replaced by only one `diamenter` value.
* Thing types are: `water`, `hole` and `exit`.

**time** - Maximum time to accomplish the level.

**name** - Level name.

**desc** - Level description.

You can contribute with more levels [registering a issue](https://github.com/aurium/dodos/issues) or informally adding links to http://new.okfnpad.org/p/dodos-levels
