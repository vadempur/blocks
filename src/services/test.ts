
/*
rollback to the hieght 
reverse the transactions


This endpoint should rollback the state of the indexer to the given height. This means that you should undo all the transactions that were added after the given height and recalculate the balance of each address. You can assume the height will never be more than 2000 blocks from the current height.
*/



let blockchain = [
    {
        transactions: [{
            id:"tx1",
            input: [],
            output: [{
                address: "shashi",
                value: 100
            }]
        }]
    },
    {
        transactions: [{
            id:"tx2",
            input:[{
                txId:"tx1",
                index:0
            }],
            output:[{
                address:"edison",
                value:50
            },
            {
                address:"shashi",
                value:50
            }
        
        ]
        }]
    },
    {
        transactions:[{
            id:"tx3",
            input:[{
                txId:"tx2",
                index:1
            }],
            output:[{
                address:"edison",
                value:50
            }]
            
        }]
    }
]


{
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
  }