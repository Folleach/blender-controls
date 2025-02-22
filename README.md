This component library is inspired by Blender because I like its UI and UX.  
Therefore, I created this repository, in which implemented some [Blender interface elements](https://docs.blender.org/manual/en/latest/interface/index.html) in [Vue](https://vuejs.org/).

#### Try it

https://blender-ui.folleach.net/

or build yourself

```bash
npm run dev
```

#### Roadmap

- [ ] workspace manager
    - [x] render areas
    - [x] move areas
    - [x] split areas
    - [ ] join areas
        - [ ] simple (when a1 and a2 inside c1)
        - [ ] foreign (when a1 and a2 visually neighbour but inside different containers)
        - [x] advanced (place everywhere)
    - [x] store workspace layouts
    - [ ] operating with a geometric neighborhood
    - [ ] separator context menu
        - [x] swap area
        - [ ] join
    - [ ] workspace tabs
        - [x] basic
        - [ ] templates
        - [ ] duplicate
        - [ ] reorder
        - [x] remove
    - [ ] api for inner areas
        - [x] swap
        - [ ] split
        - [ ] find services?
        - [ ] request size
    - [x] dynamic areas
    - [ ] change focus when Ctrl + Tab
- [ ] menus
    - [x] render
        - [x] item
        - [x] directory
    - [x] context passing
    - [ ] hotkey hints
    - [x] close when away from pointer
    - [x] close when click past the menu
    - [ ] pointer above the last use
    - [ ] reposition when went outside the page
    - [ ] custom icons
    - [x] api
        - [x] set
- [ ] keyboard shortcuts
- [ ] node editor
    - [x] global space
        - [ ] api
            - [x] pointer position in the space
            - [ ] selection
    - [x] nodes
        - [ ] drag and drop outside the current area (and browser)?
        - [ ] select multiple nodes
    - [x] sockets
        - [x] link
    - [ ] routes
    - [ ] properties (dynamic content?)
    - [ ] groups
    - [ ] frames
    - [ ] api
- [ ] routine
    - [x] tab list
        - [ ] rename on selected click
    - [x] button
    - [x] number field
        - [ ] change to text field when click
        - [ ] fix double click when drag from arrow
        - [ ] change style when dragging
    - [ ] radio button
    - [ ] text field
- [ ] custom themes

This project is **under development**.  
Unsuitable for production
