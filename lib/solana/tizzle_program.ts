/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/tizzle_program.json`.
 */
export type TizzleProgram = {
  "address": "2MxgNvaBj3UQJrKqJbmjbXDyWRjgE3XLmmofofgX7SME",
  "metadata": {
    "name": "tizzleProgram",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "checkIn",
      "docs": [
        "Check in attendee at event"
      ],
      "discriminator": [
        209,
        253,
        4,
        217,
        250,
        241,
        207,
        50
      ],
      "accounts": [
        {
          "name": "event",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  118,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "event.organization",
                "account": "event"
              },
              {
                "kind": "account",
                "path": "event.event_id",
                "account": "event"
              }
            ]
          },
          "relations": [
            "registration"
          ]
        },
        {
          "name": "registration",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "event"
              },
              {
                "kind": "account",
                "path": "registration.attendee",
                "account": "registration"
              }
            ]
          }
        },
        {
          "name": "gatekeeper",
          "signer": true,
          "relations": [
            "event"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "createEvent",
      "docs": [
        "Create a new event"
      ],
      "discriminator": [
        49,
        219,
        29,
        203,
        22,
        98,
        100,
        87
      ],
      "accounts": [
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "organization",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  114,
                  103,
                  97,
                  110,
                  105,
                  122,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "organizer"
              }
            ]
          }
        },
        {
          "name": "event",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  118,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "organization"
              },
              {
                "kind": "arg",
                "path": "eventId"
              }
            ]
          }
        },
        {
          "name": "organizer",
          "writable": true,
          "signer": true
        },
        {
          "name": "owner",
          "signer": true,
          "relations": [
            "organization"
          ]
        },
        {
          "name": "platformTreasury",
          "writable": true
        },
        {
          "name": "stakeTokenMint",
          "docs": [
            "Token mint for stake (System Program ID for native SOL)"
          ]
        },
        {
          "name": "gatekeeper"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram"
        }
      ],
      "args": [
        {
          "name": "eventId",
          "type": "pubkey"
        },
        {
          "name": "capacity",
          "type": "u32"
        },
        {
          "name": "stakeAmount",
          "type": "u64"
        },
        {
          "name": "hostFeeEnabled",
          "type": "bool"
        },
        {
          "name": "hostFeePercent",
          "type": "u8"
        },
        {
          "name": "startTime",
          "type": "i64"
        },
        {
          "name": "endTime",
          "type": "i64"
        },
        {
          "name": "unlockTime",
          "type": "i64"
        }
      ]
    },
    {
      "name": "createOrganization",
      "docs": [
        "Create a new organization"
      ],
      "discriminator": [
        60,
        173,
        177,
        39,
        122,
        23,
        68,
        185
      ],
      "accounts": [
        {
          "name": "organization",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  114,
                  103,
                  97,
                  110,
                  105,
                  122,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "treasury"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initialize",
      "docs": [
        "Initialize the Tizzle protocol"
      ],
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "treasury"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "platformFeePerSlot",
          "type": "u64"
        }
      ]
    },
    {
      "name": "refundStake",
      "docs": [
        "Claim refund after event"
      ],
      "discriminator": [
        185,
        80,
        20,
        3,
        110,
        92,
        178,
        240
      ],
      "accounts": [
        {
          "name": "event",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  118,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "event.organization",
                "account": "event"
              },
              {
                "kind": "account",
                "path": "event.event_id",
                "account": "event"
              }
            ]
          },
          "relations": [
            "registration"
          ]
        },
        {
          "name": "registration",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "event"
              },
              {
                "kind": "account",
                "path": "attendee"
              }
            ]
          }
        },
        {
          "name": "escrowVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "event"
              }
            ]
          }
        },
        {
          "name": "attendeeTokenAccount",
          "docs": [
            "Attendee's token account (only for SPL tokens, ignored for SOL)"
          ],
          "writable": true
        },
        {
          "name": "escrowTokenAccount",
          "docs": [
            "Escrow token account (only for SPL tokens, ignored for SOL)"
          ],
          "writable": true
        },
        {
          "name": "organizationTreasuryTokenAccount",
          "docs": [
            "Organization treasury token account (only for SPL tokens, ignored for SOL)"
          ],
          "writable": true
        },
        {
          "name": "tokenMint",
          "docs": [
            "Token mint (only for SPL tokens, ignored for SOL)"
          ]
        },
        {
          "name": "attendee",
          "writable": true,
          "signer": true,
          "relations": [
            "registration"
          ]
        },
        {
          "name": "organizationTreasury",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram"
        }
      ],
      "args": []
    },
    {
      "name": "registerEvent",
      "docs": [
        "Register for an event"
      ],
      "discriminator": [
        206,
        4,
        37,
        59,
        79,
        120,
        169,
        181
      ],
      "accounts": [
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "organization",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  114,
                  103,
                  97,
                  110,
                  105,
                  122,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "event.organizer",
                "account": "event"
              }
            ]
          }
        },
        {
          "name": "event",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  118,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "event.organization",
                "account": "event"
              },
              {
                "kind": "account",
                "path": "event.event_id",
                "account": "event"
              }
            ]
          }
        },
        {
          "name": "registration",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "event"
              },
              {
                "kind": "account",
                "path": "attendee"
              }
            ]
          }
        },
        {
          "name": "escrowVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "event"
              }
            ]
          }
        },
        {
          "name": "attendeeTokenAccount",
          "docs": [
            "Attendee's token account (only for SPL tokens, ignored for SOL)"
          ],
          "writable": true
        },
        {
          "name": "escrowTokenAccount",
          "docs": [
            "Escrow token account (only for SPL tokens, ignored for SOL)"
          ],
          "writable": true
        },
        {
          "name": "tokenMint",
          "docs": [
            "Token mint (only for SPL tokens, ignored for SOL)"
          ]
        },
        {
          "name": "attendee",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram"
        }
      ],
      "args": []
    },
    {
      "name": "updateConfig",
      "docs": [
        "Update protocol configuration"
      ],
      "discriminator": [
        29,
        158,
        252,
        191,
        10,
        83,
        219,
        99
      ],
      "accounts": [
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "config"
          ]
        }
      ],
      "args": [
        {
          "name": "newPlatformFeePerSlot",
          "type": {
            "option": "u64"
          }
        },
        {
          "name": "newTreasury",
          "type": {
            "option": "pubkey"
          }
        },
        {
          "name": "newIsPaused",
          "type": {
            "option": "bool"
          }
        }
      ]
    },
    {
      "name": "withdrawEarnings",
      "docs": [
        "Withdraw earnings from no-show penalties"
      ],
      "discriminator": [
        6,
        132,
        233,
        254,
        241,
        87,
        247,
        185
      ],
      "accounts": [
        {
          "name": "event",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  118,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "event.organization",
                "account": "event"
              },
              {
                "kind": "account",
                "path": "event.event_id",
                "account": "event"
              }
            ]
          }
        },
        {
          "name": "escrowVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "event"
              }
            ]
          }
        },
        {
          "name": "escrowTokenAccount",
          "docs": [
            "Escrow token account (only for SPL tokens, ignored for SOL)"
          ],
          "writable": true
        },
        {
          "name": "organizationTreasuryTokenAccount",
          "docs": [
            "Organization treasury token account (only for SPL tokens, ignored for SOL)"
          ],
          "writable": true
        },
        {
          "name": "tokenMint",
          "docs": [
            "Token mint (only for SPL tokens, ignored for SOL)"
          ]
        },
        {
          "name": "organizer",
          "writable": true,
          "signer": true,
          "relations": [
            "event"
          ]
        },
        {
          "name": "organizationTreasury",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram"
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "config",
      "discriminator": [
        155,
        12,
        170,
        224,
        30,
        250,
        204,
        130
      ]
    },
    {
      "name": "event",
      "discriminator": [
        125,
        192,
        125,
        158,
        9,
        115,
        152,
        233
      ]
    },
    {
      "name": "organization",
      "discriminator": [
        145,
        38,
        152,
        251,
        91,
        57,
        118,
        160
      ]
    },
    {
      "name": "registration",
      "discriminator": [
        158,
        129,
        230,
        90,
        93,
        95,
        101,
        55
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "protocolPaused",
      "msg": "Protocol is currently paused"
    },
    {
      "code": 6001,
      "name": "eventCapacityReached",
      "msg": "Event capacity has been reached"
    },
    {
      "code": 6002,
      "name": "invalidEventStatus",
      "msg": "Event is not in the correct status for this operation"
    },
    {
      "code": 6003,
      "name": "registrationAlreadyExists",
      "msg": "Registration already exists for this attendee"
    },
    {
      "code": 6004,
      "name": "notCheckedIn",
      "msg": "Attendee has not checked in"
    },
    {
      "code": 6005,
      "name": "alreadyRefunded",
      "msg": "Refund has already been claimed"
    },
    {
      "code": 6006,
      "name": "unlockTimeNotReached",
      "msg": "Unlock time has not been reached"
    },
    {
      "code": 6007,
      "name": "invalidHostFeePercent",
      "msg": "Invalid host fee percentage (must be 0-100)"
    },
    {
      "code": 6008,
      "name": "invalidStartTime",
      "msg": "Event start time must be in the future"
    },
    {
      "code": 6009,
      "name": "invalidEndTime",
      "msg": "Event end time must be after start time"
    },
    {
      "code": 6010,
      "name": "invalidUnlockTime",
      "msg": "Unlock time must be after end time"
    },
    {
      "code": 6011,
      "name": "invalidCapacity",
      "msg": "Capacity must be greater than zero"
    },
    {
      "code": 6012,
      "name": "invalidStakeAmount",
      "msg": "Stake amount must be greater than zero"
    },
    {
      "code": 6013,
      "name": "unauthorizedOrganizer",
      "msg": "Unauthorized: only the organizer can perform this action"
    },
    {
      "code": 6014,
      "name": "unauthorizedGatekeeper",
      "msg": "Unauthorized: only the gatekeeper can perform this action"
    },
    {
      "code": 6015,
      "name": "unauthorizedAuthority",
      "msg": "Unauthorized: only the protocol authority can perform this action"
    },
    {
      "code": 6016,
      "name": "arithmeticOverflow",
      "msg": "Arithmetic overflow occurred"
    },
    {
      "code": 6017,
      "name": "registrationNotFound",
      "msg": "Registration not found"
    },
    {
      "code": 6018,
      "name": "cannotCancelTicket",
      "msg": "Cannot cancel ticket after registration"
    },
    {
      "code": 6019,
      "name": "eventAlreadyStarted",
      "msg": "Event has already started"
    },
    {
      "code": 6020,
      "name": "insufficientFunds",
      "msg": "Insufficient funds to complete this operation"
    },
    {
      "code": 6021,
      "name": "alreadyWithdrawn",
      "msg": "Organizer has already withdrawn earnings"
    },
    {
      "code": 6022,
      "name": "invalidTokenMint",
      "msg": "Invalid token mint provided"
    }
  ],
  "types": [
    {
      "name": "config",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "treasury",
            "type": "pubkey"
          },
          {
            "name": "platformFeePerSlot",
            "type": "u64"
          },
          {
            "name": "totalEvents",
            "type": "u64"
          },
          {
            "name": "totalTickets",
            "type": "u64"
          },
          {
            "name": "totalStakedVolume",
            "type": "u64"
          },
          {
            "name": "isPaused",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "event",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "eventId",
            "type": "pubkey"
          },
          {
            "name": "organizer",
            "type": "pubkey"
          },
          {
            "name": "organization",
            "type": "pubkey"
          },
          {
            "name": "capacity",
            "type": "u32"
          },
          {
            "name": "stakeAmount",
            "type": "u64"
          },
          {
            "name": "stakeTokenMint",
            "type": "pubkey"
          },
          {
            "name": "hostFeeEnabled",
            "type": "bool"
          },
          {
            "name": "hostFeePercent",
            "type": "u8"
          },
          {
            "name": "platformFeePaid",
            "type": "u64"
          },
          {
            "name": "startTime",
            "type": "i64"
          },
          {
            "name": "endTime",
            "type": "i64"
          },
          {
            "name": "unlockTime",
            "type": "i64"
          },
          {
            "name": "totalRegistered",
            "type": "u32"
          },
          {
            "name": "totalCheckedIn",
            "type": "u32"
          },
          {
            "name": "totalStaked",
            "type": "u64"
          },
          {
            "name": "totalRefunded",
            "type": "u32"
          },
          {
            "name": "organizerWithdrawn",
            "type": "bool"
          },
          {
            "name": "gatekeeper",
            "type": "pubkey"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "organization",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "treasury",
            "type": "pubkey"
          },
          {
            "name": "totalEvents",
            "type": "u32"
          },
          {
            "name": "totalStakedVolume",
            "type": "u64"
          },
          {
            "name": "isVerified",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "registration",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "event",
            "type": "pubkey"
          },
          {
            "name": "attendee",
            "type": "pubkey"
          },
          {
            "name": "stakeAmount",
            "type": "u64"
          },
          {
            "name": "checkedIn",
            "type": "bool"
          },
          {
            "name": "refunded",
            "type": "bool"
          },
          {
            "name": "registeredAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
};
