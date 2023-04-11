const commands = [
  {
    name: 'idle',
    description: 'Idle. Use this command if there is nothing specific you want to do',
    examples: '{ command: "idle" }',
  },
  {
    name: 'answer',
    description: 'If you have reached your goal, you have to use this command. For example if the goal is to know current weather and you know it\'s raining, you have to use such command: { "command": "answer", "answer": "It\'s raining" }'
  },
  // {
  //   name: 'think',
  //   title: '/think [thought]',
  //   description: 'Adds text given in thought in your thoughts. Example: "/think [I need to tell Michael to do his job]" will add "I need to tell Michael to do his job" to your thoughts. You should use it to remember conversation content after you have spoken to a person. Like this: "/think [Michael told me he will do his job]".'
  // },
  // {
  //   name: 'approach',
  //   description: 'Approach a person with name equal to parameter "name". When you have approached this person, you can communicate with them using "say" command. You won\'t be able to speak to a person without approaching fisrt. You can not aproach yourself. You can only approach a person, not an object.',
  //   examples: [
  //   	'{ "command": "approach", "target": "Jessica" }',
  //   	'{ "command": "approach", "target": "Michael" }',
  //   	'{ "command": "approach", "target": "Jay" }'
  //   ],
  // },
  {
    name: 'say',
    description: 'Says the phrase given in parameter "phrase" to the target person.',
    examples: [
    	'{ "command": "say", "target": "Ann", phrase": "Hello" }',
    	'{ "command": "say", "target": "Arthur", phrase": "Hi, Arthur! Please help me with my task." }',
    ]
  },
  {
    name: 'leave',
    description: 'Leaves the person currently approached by you.',
    examples: [
      '{ "command": "leave" }',
    ]
  },
  {
    name: 'create',
    description: 'Creates new person with a given name and desription. Provide big, detailed description, listing all jobs this person will be capable of doing.',
    examples: [
    '{ "command": "create", "name": "Jay", "description": "Jay is a Javascript developer. He can write good javascript code. He knows a little python too."}',
    ]
  }
]

module.exports = commands;