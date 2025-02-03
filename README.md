I like blender ui and user experience.  
Therefore, I created this repository, in which implemented some [Blender interface elements](https://docs.blender.org/manual/en/latest/interface/index.html) on [Vue](https://vuejs.org/).

#### Try it

https://folleach.net/blender-controls/storybook/index.html

or build yourself

```bash
npm run storybook
```

#### Roadmap

- [ ] workspace manager
    - [x] render areas
    - [x] move areas
    - [x] split areas
    - [ ] join areas
    - [x] store workspace layouts
    - [ ] separator context menu
        - [x] swap area
        - [ ] join left/right
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
- [ ] routine buttons, etc...
    - [x] tab list
        - [ ] rename on selected click
    - [ ] button
- [ ] custom themes

This project is **under development**.  
Unsuitable for production
