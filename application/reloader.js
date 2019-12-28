const file_list = dir => new Promise(resolve =>
    dir.createReader().readEntries(items =>
        Promise.all(items.filter(i => i.name[0] !== '.').map(i =>
            i.isDirectory
                ? file_list(i)
                : new Promise(resolve => i.file(resolve))
        ))
        .then(files => [].concat (...files))
        .then(resolve)
    )
)

const file_list_timestamp = dir =>
        file_list(dir).then(files =>
            files.map(f => f.name + f.lastModifiedDate).join())

const reload = () => {
    chrome.tabs.query({ active: true, currentWindow: true}, tabs => {
        if(tabs[0]) {
            chrome.tabs.reload(tabs[0].id)
        }
        chrome.runtime.reload()
    })
}

const watchChanges = (dir, previous_timestamp) => {
    file_list_timestamp(dir).then(timestamp => {
        if(!previous_timestamp || (previous_timestamp === timestamp)) {
            setTimeout(() => watchChanges(dir, timestamp), 1000)
        } else {
            reload()
        }
    })
}

chrome.management.getSelf(self => {
    if(self.installType === 'development') {
        chrome.runtime.getPackageDirectoryEntry(dir => watchChanges (dir))
    }
})