const fs = require('fs');
const path = require('path');
const commands = require('./commands');
const prompt = require('prompt-sync')();
require("dotenv").config({ path: "./.env" });

const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const persons = [];

const basicTasks = [
  'To count to ten',
  'To translate the phrase "London is the capital of Great Britain" into German and Russian',
  'To write a short poem about John and Ann',
  'To choose the most useful person in company',
]

class Person {
  log = [];
  thoughts = [];

  constructor(name, description, allowedCommands, goal) {
    this.name = name;
    this.description = description;
    this.description += ' This person will not agree to do ANY job apart from his main speciality.\n'
    this.goal = goal ?? 'To assist John, but politely decline if he asks you to do somethin apart from your speciality.\n';
    this.allowedCommands = allowedCommands ?? commands.map(cmd => cmd.name);
    fs.writeFileSync(`./logs/${name}.log`, '');
  }

  printRules = () => {
    let res = 'This is a role-playing game. You have a goal in the game. When you will have reached your goal you should stop the game and give an answer.\n';
    res += 'You can only perform actions allowed by game rules. You can not say anything except commands to perform actions. You can only perform one command at a time.\n';
    res += 'To execute a command, you need to send a JSON object with key "command" equal to command name and all necessary params.\n';
    res += 'Do not include anything apart from JSON in your message. Only JSON with your command is allowed.\n';
    res += 'For example, if you want to speak with John do not write "I want to speak to John". Use the "say" command.\n';
    res += 'Like that: { "command": "say", "target": "John", "phrase": "Hello, John!" }\n';
    return res;
  }

  printSelf = () => {
    let res = `You are ${this.name}\n\n`;
    res += this.description;
    return res;
  }

  printApproached = () => {
    return `${this.nearbyPerson} is nearby. This person will hear you if you use the "say" command.`
  }

  printThoughts = () => {
    let res = 'Your thoughts: \n\n';
    let i = 1;
    for (let thought of this.thoughts) {
      res += `${i}) ${thought}\n\n`;
      i++;
    }
    return res;
  } 

  printPersons = () => {
    let res = 'List of persons: \n\n';
    for (let person of persons) {
      res += person.name;
      if (person === this) {
        res += ' (you)';
      }
      res += '\n';
      res += person.description;
      res += '\n\n';
    }
    return res;
  }

  printGoal = () => {
    return `Your main goal:\n${this.goal}`
  }

  printCommands = () => {
    let res = 'List of allowed commands: \n\n';
    for (let allowedCommand of this.allowedCommands) {
      let command = commands.find(cmd => cmd.name === allowedCommand);
      if (!command) continue;
      if (command.name === 'leave' && !this.nearbyPerson) continue;
      res += `${command.name}\n${command.description}\n`;
      if (command.examples) {
        res += 'Examples:\n'
        for (let example of command.examples) {
          res += example;
          res += '\n';
        }
      }
      res += '===\n'
    }
    return res;
  }

  async command_approach(params) {
    let { target } = params;
    let targetPerson = persons.find(p => p.name === target);
    if (!targetPerson) throw new Error(`There is no person with name ${target}.`);
    if (target === this.name) throw new Error('You can\'t approach yourself');
    if (this.nearbyPerson) {
      this.nearbyPerson.event(`${this.name} left you.`);
      this.nearbyPerson.nearbyPerson = undefined;
    }
    this.nearbyPerson = targetPerson;
    targetPerson.nearbyPerson = this;
    await targetPerson.event(`${this.name} approached you.`)
    console.log(`ACTION: ${this.name} approached ${target}.`)
    return await this.event(`You approached ${targetPerson.name}. Now you can speak to him/her using the "say" command.`, true);
  }

  async command_say(params) {
    let { phrase, target } = params;
    let targetPerson = persons.find(p => p.name === target);
    if (!targetPerson) throw new Error(`Error: Person with name ${target} not found.`)
    console.log(`ACTION: ${this.name} says to ${target}: ${phrase}`);
    await this.event(`You said: "${phrase}"`);
    return await targetPerson.event(`${this.name} said: ${phrase}`, true);
  }

  async completeTask(task) {
    this.goal = task;
    this.idle = false;
    return await this.event(`Your new goal as ${this.name} is: ${task}`, true)
  }

  async command_leave(params) {
    if (!this.nearbyPerson) {
      throw new Error(`${this.name} tried to leave, but has no nearby person`);
    }
    console.log(`ACTION: ${this.name} leaves ${this.nearbyPerson.name}.`);
    var nearbyPersonName = this.nearbyPerson.name;
    this.nearbyPerson.event(`${this.name} left you.`);
    this.nearbyPerson.nearbyPerson = undefined;
    this.nearbyPerson = undefined;
    return await this.event(`You left ${nearbyPersonName}.`, true);
  }

  async command_idle(params) {
    this.idle = true;
    console.log(`ACTION: ${this.name} is idling...`);
    let nextPerson;
    for (let person of persons) {
      if (!person.idle) {
        nextPerson = person;
        break;
      }
    }
    if (nextPerson) {
      console.log(`--- Now following ${nextPerson.name}...`);
      return await nextPerson.act();
    } else {
      console.log('--- Everyone is idling. Ending the simulation ---')
    }
  }

  async command_answer(params) {
    let { answer } = params;
    console.log(`ACTION: ${this.name} completes the mission: ${answer}`)
    console.log('ENDING!');
  }

  async command_think(params) {
    let { thought } = params;
    console.log(`ACTION: ${this.name} thinks: "${thought}"`)
    return await this.event(`You think: "${thought}"`, true)
  }

  async command_create(params) {
    let { name, description } = params;
    let pers = new Person(name, description, [ 'idle',  'say' ]);
    persons.push(pers);
    console.log(`ACTION: ${this.name} created a person named ${name} (${description})`)
    for (let person of persons) {
      await person.event(`${this.name} created a person named ${name} (${description})`);
    }
    return await this.event(`You successfully created a person named "${name}".`, true);
  }

  pushMessage(content, role = 'system') {
    let textRole = role === 'system' ? 'System' : this.name;
    let message = `${textRole}: ${content}`;
    fs.appendFileSync(`./logs/${this.name}.log`, message + '\n');
    this.log.push({
      role,
      content,
    })
  }

  async event(text, awaitReaction = false) {
    this.idle = false;
    this.pushMessage(text)
    if (awaitReaction) {
      return await this.act();
    }
  }

  async act() {
    let messages = [];
    messages.push({
      role: 'system',
      content: this.printRules(),
    });
    messages.push({
      role: 'system',
      content: this.printSelf(),
    })
    messages.push({
      role: 'system',
      content: this.printGoal(),
    });
    messages.push({
      role: 'system',
      content: this.printCommands(),
    });
    messages.push({
      role: 'system',
      content: this.printPersons(),
    });
    messages = messages.concat(this.log);
    messages.push({
      role: 'system',
      content: 'Please perform your next action',
    })
    let answer = await sendGPT(messages);
    this.pushMessage(answer, 'assistant');
    let commandData;
    try {
      commandData = parseCommand(answer);
    } catch (e) {
      console.error(`Error while parsing command by ${this.name}: `, answer);
      this.pushMessage(e.message)
      return await this.act();
    }
    let methodName = `command_${commandData.command}`;
    if (!this[methodName]) throw new Error(`Person ${this.name} has no method ${methodName}`);
    let res;
    try {
      res = await this[methodName](commandData)
    } catch (err) {
      console.error(`Error while executing command of ${this.name}: `, commandData, err)
      this.pushMessage('ERROR: ' + err.message);
      return await this.act();
    }
    return res;
  }
}

const parseCommand = (textCommand) => {
  let parsed;
  let json = textCommand.match(/\{(?:[^{}])*\}/g);
  if (json.length > 1) {
    throw new Error('Error: You provided more than one command at once. Please repeat your action using only one command.')
  } 
  if (json.length === 0) {
    throw new Error('Error: JSON command was not found. Please make sure you have provided valid JSON.')
  }
  try {
    parsed = JSON.parse(json);
    parsed.raw = textCommand;
    parsed.json = json;
    return parsed;
  } catch (e) {
    throw new Error('Error: JSON command was not found. Please make sure you have provided valid JSON.')
  }
}


const printResult = (messages) => {
  let res = '';
  for (let message of messages) {
    res = res + message.role + ': ' + message.content + '\n';
  }
}


const sendGPT = async (messages) => {
  // console.log('Sending GPT:', messages)
  const completion = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages,
  });
  let response = completion.data.choices[0].message.content;
  // console.log(response)
  return response;
}

// run();

let john = new Person(
  'John', 
  'John is a person. He is the boss. He can\'t perform any task by himself, but he can ask Ann to create specialists. John will not idle until he has reached his goal.',
  [ 'say', 'answer', 'idle' ],
  'To idle all the time',

);
persons.push(john);

let ann = new Person(
  'Ann', 
  'She can create other persons. She won\'t assist John with anything else. She won\'t create a person until explicitly asked by John.',
  [ 'say', 'create', 'idle' ],
  'To create persons when somebody asks',
);
persons.push(ann)


const main = () => {
  if (basicTasks.length === 0) {
    console.log('ending...');
  } else {
    let mission = basicTasks.shift();
    console.log('CURRENT TASK: ', mission);
    john.completeTask(mission).then(() => {
      main();
    });
  }
  // let mission = prompt('What is the next mission? ');
  // if (mission) {
  //   john.completeTask(mission).then(() => {
  //     main();
  //   });
  // } else {
  //   console.log('ending...')
  // }
}

main();



