const commands = [
  {
    name: 'idle',
    title: '/idle',
    description: 'Idle. Use this command if there is nothing specific you want to do',
  },
  {
    name: 'answer',
    title: '/answer %answer',
    description: 'If you have reached your goal, you have to use this command. For example if the goal is to know current weather and you know it\'s raining, you have to use such command: "/answer It\'s raining."'
  },
  // {
  //   name: 'think',
  //   title: '/think [thought]',
  //   description: 'Adds text given in thought in your thoughts. Example: "/think [I need to tell Michael to do his job]" will add "I need to tell Michael to do his job" to your thoughts. You should use it to remember conversation content after you have spoken to a person. Like this: "/think [Michael told me he will do his job]".'
  // },
  {
    name: 'approach',
    title: '/approach %name',
    description: 'Approach a person with name equal to parameter "name". When you have approached this person, you can communicate with them using "/say" command. You won\'t be able to speak to a person without approaching fisrt. You can not aproach yourself. You can only approach a person, not an object.',
    examples: [
    	'/approach Jessica',
    	'/approach Michael',
    	'/approach Andy',
    ],
  },
  {
    name: 'say',
    title: '/say %phrase',
    description: 'Says the phrase given in parameter "phrase" to the person who is currently approached by you. If the person is not approached by you, you need to approach them first.',
    examples: [
    	'/say Hello, Ann!',
    	'/say Hi, Arthur! Please help me with some code!'
    ]
  },
  {
    name: 'leave',
    title: '/leave',
    description: 'Leaves the person currently approached by you.'
  },
  {
    name: 'create',
    title: '/create %description',
    description: 'Creates new person with a desription. Do not include name in the description. Include only dry facts in the description. Provide big, detailed description, listing all jobs this person will be capable of doing.',
    examples: [
      '/create This person is a Javascript developer. He can write good javascript code. He knows a little python too.'
    ]
  }
]

module.exports = commands;