document.addEventListener('DOMContentLoaded', function() {
  const commandInput = document.getElementById('command');
  const categoryInput = document.getElementById('category');
  const saveButton = document.getElementById('save');
  const commandList = document.getElementById('commandList');

  // Load saved commands
  loadCommands();

  // Save command
  saveButton.addEventListener('click', saveCommand);

  function saveCommand() {
    const command = commandInput.value.trim();
    const category = categoryInput.value.trim() || 'Uncategorized';
    
    if (command) {
      chrome.storage.sync.get(['npmCommands'], function(result) {
        const commands = result.npmCommands || {};
        if (!Array.isArray(commands[category])) {
          commands[category] = [];
        }
        commands[category].push(command);
        chrome.storage.sync.set({ npmCommands: commands }, function() {
          console.log('Command saved:', { category, command });
          loadCommands();
          commandInput.value = '';
          categoryInput.value = '';
        });
      });
    }
  }

  function loadCommands() {
    chrome.storage.sync.get(['npmCommands'], function(result) {
      const commands = result.npmCommands || {};
      console.log('Loaded commands:', commands);
      displayCommands(commands);
    });
  }

  function displayCommands(commands) {
    commandList.innerHTML = '';
    for (const [category, categoryCommands] of Object.entries(commands)) {
      if (Array.isArray(categoryCommands) && categoryCommands.length > 0) {
        addCategoryToList(category, categoryCommands);
      }
    }
  }

  function addCategoryToList(category, commands) {
    console.log('Adding category to list:', category, commands);
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'category-item';

    const categoryHeader = document.createElement('div');
    categoryHeader.className = 'category-header';
    categoryHeader.textContent = category;
    
    const toggleIcon = document.createElement('i');
    toggleIcon.className = 'fa fa-chevron-down toggle-icon';
    categoryHeader.appendChild(toggleIcon);

    const commandsDiv = document.createElement('div');
    commandsDiv.className = 'category-commands';

    categoryHeader.addEventListener('click', function() {
      const isOpen = commandsDiv.style.display === 'block';
      
      // Close all other open dropdowns
      document.querySelectorAll('.category-commands').forEach(div => {
        div.style.display = 'none';
      });
      document.querySelectorAll('.toggle-icon').forEach(icon => {
        icon.classList.remove('open');
      });

      // Toggle the current dropdown
      commandsDiv.style.display = isOpen ? 'none' : 'block';
      toggleIcon.classList.toggle('open', !isOpen);
    });

    commands.forEach(command => {
      const commandItem = createCommandItem(command);
      commandsDiv.appendChild(commandItem);
    });

    categoryDiv.appendChild(categoryHeader);
    categoryDiv.appendChild(commandsDiv);
    commandList.appendChild(categoryDiv);
  }

  function createCommandItem(command) {
    const div = document.createElement('div');
    div.className = 'command-item';
    
    const commandText = document.createElement('span');
    commandText.textContent = command;
    div.appendChild(commandText);

    const copyButton = document.createElement('button');
    copyButton.className = 'copy-button';
    copyButton.innerHTML = '<i class="fa-regular fa-clipboard"></i>';
    copyButton.addEventListener('click', function() {
      navigator.clipboard.writeText(command);
      copyButton.innerHTML = '<i class="fa-solid fa-check"></i>';
      setTimeout(() => {
        copyButton.innerHTML = '<i class="fa-regular fa-clipboard"></i>';
      }, 1500);
    });

    div.appendChild(copyButton);
    return div;
  }
});
