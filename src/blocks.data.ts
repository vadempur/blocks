export const blocks = [{
    "height": 2,
    "id":"c4701d0bfd7179e1db6e33e947e6c718bbc4a1ae927300cd1e3bda91a930cba5",
    "transactions": [
      {
        "id": "tx2",
        "inputs": [
          {
            "txId": "tx1",
            "index": 0
          }
        ],
        "outputs": [
          {
            "address": "addr2",
            "value": 40
          },
          {
            "address": "addr3",
            "value": 60
          }
  
        ]
      }
    ]
  },
  {
    "height": 3,
    "id":"4e5f22a2abacfaf2dcaaeb1652aec4eb65028d0f831fa435e6b1ee931c6799ec",
    "transactions": [
      {
        "id": "tx3",
        "inputs": [
          {
            "txId": "tx2",
            "index": 0
          }
        ],
        "outputs": [
          {
            "address": "addr4",
            "value": 20
          },
          {
            "address": "addr5",
            "value": 20
          }
  
        ]
      }
    ]
  },
  {
    "height": 4,
    "id":"6210643d0b2afcf188a0d9c846c1e3ef1535e2c97f5541f88803633144510dcb",
    "transactions": [
      {
        "id": "tx4",
        "inputs": [
          {
            "txId": "tx3",
            "index": 0
          }
        ],
        "outputs": [
          {
            "address": "addr6",
            "value": 10
          },
          {
            "address": "addr7",
            "value": 10
          }
  
        ]
      }
    ]
  },
  {
    "height": 5,
    "id":"926f9a4bfa49f84a5d177885cc78ab8a18afb895f386305fba0a23ee653bd64d",
    "transactions": [
      {
        "id": "tx5",
        "inputs": [
          {
            "txId": "tx4",
            "index": 0
          }
        ],
        "outputs": [
          {
            "address": "addr8",
            "value": 5
          },
          {
            "address": "addr9",
            "value": 5
          }
  
        ]
      }
    ]
  },
  {
    "height": 6,
    "id":"d5de48ae0d428b34eb77971ad807e61e793be44c22e6e2ea2215f35e98f4686a",
    "transactions": [
      {
        "id": "tx6",
        "inputs": [
          {
            "txId": "tx5",
            "index": 0
          }
        ],
        "outputs": [
          {
            "address": "addr10",
            "value": 2
          },
          {
            "address": "addr11",
            "value": 3
          }
  
        ]
      }
    ]
  }

]