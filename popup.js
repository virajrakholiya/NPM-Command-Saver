document.addEventListener('DOMContentLoaded', function() {
  const commandInput = document.getElementById('command');
  const categoryInput = document.getElementById('category');
  const saveButton = document.getElementById('save');
  const commandList = document.getElementById('commandList');
  const errorMessage = document.getElementById('error-message');
  const toggleDeleteButton = document.getElementById('toggle-delete');

  // Load saved commands
  loadCommands();

  // Save command
  saveButton.addEventListener('click', saveCommand);

  // Toggle delete buttons
  toggleDeleteButton.addEventListener('click', function() {
    commandList.classList.toggle('hide-delete');
  });

  function saveCommand(event) {
    event.preventDefault(); // Prevent form submission

    const command = commandInput.value.trim();
    const category = categoryInput.value.trim();

    if (!command) {
      errorMessage.textContent = 'Command is required';
      errorMessage.style.display = 'block';
      return;
    }

    if (!category) {
      errorMessage.textContent = 'Category is required';
      errorMessage.style.display = 'block';
      return;
    } else {
      errorMessage.style.display = 'none';
    }

    chrome.storage.sync.get(['npmCommands'], function(result) {
      const commands = result.npmCommands || {};
      if (!Array.isArray(commands[category])) {
        commands[category] = [];
      }
      commands[category].push(command);
      saveCommandsToStorage(commands, category, command);
    });
  }

  function saveCommandsToStorage(commands, category, command) {
    chrome.storage.sync.set({ npmCommands: commands }, function() {
      if (chrome.runtime.lastError) {
        console.error('Error saving command:', chrome.runtime.lastError);
        return;
      }
      console.log('Command saved:', { category, command });
      loadCommands();
      commandInput.value = '';
      categoryInput.value = '';
    });
  }

  function loadCommands() {
    document.getElementById('loading').style.display = 'block';
    chrome.storage.sync.get(['npmCommands'], function(result) {
      const commands = result.npmCommands || {};
      console.log('Loaded commands:', commands);
      displayCommands(commands);
      document.getElementById('loading').style.display = 'none';
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
      const commandItem = createCommandItem(command, category);
      commandsDiv.appendChild(commandItem);
    });

    categoryDiv.appendChild(categoryHeader);
    categoryDiv.appendChild(commandsDiv);
    commandList.appendChild(categoryDiv);
  }

  function createCommandItem(command, category) {
    const div = document.createElement('div');
    div.className = 'command-item';
    
    const commandText = document.createElement('span');
    commandText.textContent = command;
    div.appendChild(commandText);

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'command-actions';

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

    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-button';
    deleteButton.innerHTML = '<i class="fa-solid fa-trash-alt"></i>';
    deleteButton.addEventListener('click', function() {
      deleteCommand(command, category, div);
    });

    actionsDiv.appendChild(copyButton);
    actionsDiv.appendChild(deleteButton);
    div.appendChild(actionsDiv);

    return div;
  }

  function deleteCommand(command, category, commandElement) {
    chrome.storage.sync.get(['npmCommands'], function(result) {
      const commands = result.npmCommands || {};
      if (Array.isArray(commands[category])) {
        const index = commands[category].indexOf(command);
        if (index > -1) {
          commands[category].splice(index, 1);
          if (commands[category].length === 0) {
            delete commands[category];
            // Remove the category element from the DOM
            commandElement.closest('.category-item').remove();
          } else {
            commandElement.remove(); // Remove the command element from the DOM
          }
          // Save the updated commands to storage
          chrome.storage.sync.set({ npmCommands: commands }, function() {
            if (chrome.runtime.lastError) {
              console.error('Error updating commands:', chrome.runtime.lastError);
              return;
            }
            console.log('Commands updated:', commands);
          });
        }
      }
    });
  }

  // Initial render
  loadCommands();
});
