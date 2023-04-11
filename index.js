const fs = require('fs');
const path = require('path');
const commands = require('./commands');
const prompt = require('prompt-sync')();
require("dotenv").config({ path: "./.env" });

const names = [
  'Wade',
  'Dave',
  'Seth',
  'Ivan',
  'Riley',
  'Gilbert',
  'Jorge',
  'Dan',
  'Brian',
  'Roberto',
  'Ramon',
  'Miles',
  'Liam',
  'Nathaniel',
  'Ethan',
  'Lewis',
  'Milton',
  'Claude',
  'Joshua',
  'Glen',
  'Harvey',
  'Blake',
]


const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
console.log(process.env.OPENAI_API_KEY)
const openai = new OpenAIApi(configuration);

const persons = [];

class Person {
  log = [];
  thoughts = [];

  constructor(name, description, allowedCommands, goal) {
    this.name = name;
    this.description = description;
    this.description += ' This person will not agree to do ANY job apart from his main speciality'
    this.goal = goal ?? 'To assist John, but politely decline if he asks you to do somethin apart from your speciality.';
    this.allowedCommands = allowedCommands ?? commands.map(cmd => cmd.name);
  }

  printRules = () => {
    let res = 'This is a role-playing game. You have a goal in the game. When you will have reached your goal you should stop the game and give an answer.';
    res += 'You can only perform actions allowed by game rules. You can not say anything except commands to perform actions. You can only perform one command at a time.';
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
      res += `${command.title}\n${command.description}\n`;
      if (command.examples) {
        res += 'Examples:\n'
        for (let example of command.examples) {
          res += example;
          res += '\n';
        }
      }
      if (command.name === 'say') {
        if (this.nearbyPerson) {
          res += `The only person who is currently nearby is ${this.nearbyPerson.name}. If you want someone other to hear you, approach them first`
        }
      };
      res += '===\n'
    }
    return res;
  }

  async command_approach(commandData) {
    let [ targetName ] = commandData.args;
    let target = persons.find(p => p.name === targetName);
    if (!target) throw new Error(`There is not person with name ${targetName}. Are you sure you have used the command correctly? Please do not include "." in the command`);
    if (targetName === this.name) throw new Error('You can\'t approach yourself');
    if (this.nearbyPerson) {
      this.nearbyPerson.event(`${this.name} left you.`);
      this.nearbyPerson.nearbyPerson = undefined;
    }
    this.nearbyPerson = target;
    target.nearbyPerson = this;
    await target.event(`${this.name} approached you.`)
    console.log(`ACTION: ${this.name} approached ${targetName}.`)
    return await this.event(`You approached ${target.name}. Now you can speak to him/her using the "/say" command.`, true);
  }

  async command_say(commandData) {
    let [ phrase ] = commandData.args;
    if (!phrase) {
      console.log(commandData)
    }
    console.log(`ACTION: ${this.name} says: ${phrase}`);
    if (this.nearbyPerson) {
      await this.event(`You said: "${phrase}"`);
      return await this.nearbyPerson.event(`${this.name} said: ${phrase}`, true);
    } else {
      return await this.event(`You said: "${phrase}"`, true);
    }
  }

  async completeTask(task) {
    this.goal = task;
    this.idle = false;
    return await this.event(`Your new goal as ${this.name} is: ${task}`, true)
  }

  async command_leave(commandData) {
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

  async command_idle(commandData) {
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

  async command_answer(commandData) {
    let [ answer ] = commandData.args;
    console.log(`ACTION: ${this.name} completes the mission: ${answer}`)
    console.log('ENDING!');
  }

  async command_think(commandData) {
    let [ thought ] = commandData.args;
    console.log(`ACTION: ${this.name} thinks: "${thought}"`)
    return await this.event(`You think: "${thought}"`, true)
  }

  async command_create(commandData) {
    let [ description ] = commandData.args;
    let [ name ] = names.splice(Math.floor(Math.random() * names.length));
    // description += description + ' This person will decline'
    let pers = new Person(name, description, [ 'idle', 'approach', 'say', 'leave' ]);
    persons.push(pers);
    console.log(`ACTION: ${this.name} created a person named ${name} (${description})`)
    for (let person of persons) {
      await person.event(`${this.name} created a person named ${name} (${description})`);
    }
    return await this.event(`You successfully created a person named "${name}".`, true);
  }

  async event(text, awaitReaction = false) {
    this.idle = false;
    this.log.push({
      role: 'system',
      content: text,
    })
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
    if (this.nearbyPerson) {
      messages.push({
        role: 'system',
        content: `${this.nearbyPerson.name} is currently approached by you. You can converse with him/her using the "/say" command if you want to.`
      })
    }
    messages.push({
      role: 'system',
      content: 'Please perform your next action',
    })
    let answer = await sendGPT(messages);
    let commandData;
    try {
      commandData = parseCommand(answer);
    } catch (err) {
      console.error(`WRONG COMMAND BY ${this.name}: `, commandData.raw)
      console.log(this.log)
      console.log(messages)
      this.log.push({
        role: 'system',
        content: 'ERROR: ' + err.message,
      })
      return await this.act();
    } finally {
      if (!commandData) {
        this.log.push({
          role: 'system',
          content: 'ERROR: ' + 'Command was not parsed. Make sure you included a slash (/) and used lowercase command',
        })
        return await this.act();
      }

      let methodName = `command_${commandData.command}`;
      if (!this[methodName]) throw `Person ${this.name} has no method ${methodName}`;
      this.log.push({
        role: 'assistant',
        content: commandData.raw,
      })
      let res;
      try {
        res = await this[methodName](commandData)
      } catch (err) {
         console.error(`WRONG COMMAND BY ${this.name}: `, commandData.raw)
         console.log(this.log)
         console.log(messages)
        this.log.push({
          role: 'system',
          content: 'ERROR: ' + err.message,
        })
        return await this.act();
      } finally {
        return res
      };
    }
  }
}

const parseCommand = (textCommand) => {
  const matchArgs = () => {
    let res = [];
    let parsedArgs = textCommand.matchAll(/\[[^\[\]]+\]/g);
    for (let parsedArg of parsedArgs) {
      res.push(parsedArg[0].slice(1, -1))
    }
    return res;
  }

  for (let command of commands) {
    let regex = new RegExp(`(?<command>\/${command.name}\\s*)(?<arg>.*)`, "i");
    let match = textCommand.match(regex)
    if (match) {
      let res = {
        raw: textCommand,
        command: command.name,
      }
      res.args = [ match.groups.arg ]
      return res;
    }
  }
  throw new Error('Command was not parsed. Make sure you used the correct command, used a lowecase word and included a slash (/) at the start.')
}


const printResult = (messages) => {
  let res = '';
  for (let message of messages) {
    res = res + message.role + ': ' + message.content + '\n';
  }
  console.log(res)
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
  'John is a person. He is the boss. He can\'t perform any task by himself, but he can ask Ann to create specialists.',
  [ 'approach', 'say', 'leave', 'answer', 'idle', 'think' ],
  'To idle all the time',

);
persons.push(john);

let ann = new Person(
  'Ann', 
  'She can create other persons. She won\'t assist John with anything else. She won\'t create a person until explicitly asked by John.',
  [ 'approach', 'say', 'leave', 'create', 'idle' ],
  'To create persons when somebody asks',
);
persons.push(ann)


const main = () => {
  let mission = prompt('What is the next mission?');
  if (mission) {
    john.completeTask(mission).then(() => {
      main();
    });
  } else {
    console.log('ending...')
  }
}

main();



