import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import io from 'socket.io-client';

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import SendIcon from '@mui/icons-material/Send';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Snackbar from '@mui/material/Snackbar';

import background from '../assets/background.svg'; // Replace with the actual path to your SVG file

const ORIGIN = import.meta.env.VITE_ORIGIN

function Chat() {
  const navigate = useNavigate();
  const { room } = useParams();
  const [text, setText] = useState('');
  const [chat, setChat] = useState();
  const [open, setOpen] = useState(false);
  const [join, setJoin] = useState(false);
  const [alert, setAlert] = useState();
  const chatRef = useRef(chat)
  const socketRef = useRef(null);
  const chatBoxRef = useRef(null);


  useEffect(() => {
    // Scroll to the bottom of the chat box when chat state changes
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [chat]);

  useEffect(() => {
    chatRef.current = chat;
  }, [chat])

  useEffect(() => {
    socketRef.current = io.connect(ORIGIN)
  }, [])


  useEffect(() => {
    socketRef.current.on('connect', () => {
      socketRef.current.emit("join", room, (chat) => {
        if (chat != false) {
          setChat(chat);
        }
        else {
          navigate(`/`, { state: true })
        }
      })
    })

    socketRef.current.on('get', (callback) => {
      // acknowledgement
      callback(chatRef.current)
    })

    socketRef.current.on('joined', (participant) => {

      console.log(participant, ' joined');
      let temp = {
        room: room,
        participants: [...chatRef.current.participants],
        messages: [...chatRef.current.messages],
      }

      temp.participants.push(participant)
      setChat(temp);
      setAlert(`${participant.name} joined`)
      setJoin(true);
      setOpen(true);
    })

    socketRef.current.on('receive', (message) => {


      console.log("receiving");
      let temp = {
        room: chatRef.current.room,
        participants: [...chatRef.current.participants],
        messages: [...chatRef.current.messages],
      }

      console.log('recieved', temp)
      temp.messages.push(message);
      setChat(temp);
    })

    socketRef.current.on('left', (socket) => {
      let temp = {
        room: chatRef.current.room,
        participants: [...chatRef.current.participants],
        messages: [...chatRef.current.messages],
      }

      for (let i = 0; i < temp.participants.length; i++) {
        if (temp.participants[i].socket == socket) {
          temp.participants[i].connected = false;
          setChat(temp);
          setAlert(`${temp.participants[i].name} left`)
          setJoin(false);
          setOpen(true);
          break;
        }
      }

    })

  }, [socketRef.current])


  const send = async () => {
    if (text != "" && !/^\s*$/.test(text)) {
      let message = {
        participant: chat.participants.findIndex(participant => participant.socket == socketRef.current.id),
        content: text,
        time: new Date(),
        _id: (() => {
          const length = 24;
          const characters = '0123456789ABCDEF';
          let result = '';

          for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            result += characters.charAt(randomIndex);
          }

          return result;
        })(),
      }

      console.log("receiving");
      let temp = {
        room: chat.room,
        participants: [...chat.participants],
        messages: [...chat.messages],
      }

      temp.messages.push(message);
      setChat(temp);
      socketRef.current.emit('send', room, message);

      setText('');
    }
  }

  const handleKeyPress = (e) => {
    let key = e.key;
    if (key == 'Enter') {
      send();
    }
  }

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {room}
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        ref={chatBoxRef}
        sx={{
          height: "calc(100vh - 128px)",
          backgroundImage: ` url(${background})`,
          overflowY: "auto",
        }}
      > {chat &&
        <Stack direction="column" spacing={1} sx={{ p: 1 }}>
          {chat.messages.length > 0 &&
            chat.messages.map((message) => (
              <Paper key={message._id}
                sx={{
                  p: '8px 16px',
                  color: 'primary.contrastText',
                  alignSelf: (chat.participants[message.participant].socket == socketRef.current.id ? 'flex-end' : 'flex-start'),
                  bgcolor: (chat.participants[message.participant].connected ? (chat.participants[message.participant].socket == socketRef.current.id ? 'secondary.main' : 'primary.main') : 'primary.light'),
                  maxWidth: '89%',
                  wordWrap: 'break-word',
                }} >
                <Typography variant="caption" sx={{ textDecoration: chat.participants[message.participant].connected ? 'none' : 'line-through' }}>
                  {chat.participants[message.participant].name}
                </Typography>
                <Typography variant="body1">
                  {message.content}
                </Typography>
                <Typography variant="caption">
                  {(new Date(message.time).getHours() < 10 ? '0':'') + new Date(message.time).getHours() + ":" + (new Date(message.time).getMinutes() < 10? '0': '') + new Date(message.time).getMinutes()}
                </Typography>
              </Paper>
            ))}
        </Stack>
        }
      </Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: '16px',
          height: '64px',
          bgcolor: 'primary.light',
          color: "white"
        }}
      >
        <TextField
          size='small'
          value={text}
          fullWidth
          onChange={(e) => { setText(e.target.value) }}
          onKeyPress={(e) => handleKeyPress(e)}
          sx={{
            input: { color: 'primary.contrastText' },
            borderRadius: '5px',
            bgcolor: "primary.dark",
            height: '40px',
            width: '100%',
            fontSize: '21px'
          }}
        />
        <Button variant="contained" endIcon={<SendIcon />}
          onClick={() => { send() }}
          sx={{
            height: '36px',
            ml: '16px',
            bgcolor: 'primary.dark'
          }}
        >
          Send
        </Button>
      </Box>
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        open={open}
        onClose={() => {
          setOpen(false);
        }}
        message={alert}
        ContentProps={{
          sx: {
            color: 'error.contrastText',
            bgcolor: join ? 'success.main' : "error.main"
          }
        }}

        autoHideDuration={5000}
      />
    </>
  );
}

export default Chat;