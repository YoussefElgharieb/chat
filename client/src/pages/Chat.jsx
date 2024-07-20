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
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

import LinearProgress from '@mui/material/LinearProgress';
import background from '../assets/background.svg'; // Replace with the actual path to your SVG file

const ORIGIN = import.meta.env.VITE_ORIGIN
console.log(import.meta.env.VITE_ORIGIN);

function Chat() {
  const navigate = useNavigate();
  const { room } = useParams();
  const [text, setText] = useState('');
  const [chat, setChat] = useState();
  const [open, setOpen] = useState(false);
  const [join, setJoin] = useState(false);
  const [alert, setAlert] = useState();
  const [connected, setConnected] = useState(false);
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
        setConnected(true);
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
      <AppBar position="static" sx={{
        position:"fixed",
        top:0,
        }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {room}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        ref={chatBoxRef}
        sx={{
          minHeight: "100vh",
          backgroundImage: ` url(${background})`,
          overflowY: "auto",
        }}
      > <Box sx={{height: '64px',}}></Box>
        {chat &&
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

        <Box sx={{height: '64px',}}></Box>
      </Box>

      <Box
        sx={{
          position:'fixed',
          bottom:0,
          left:0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: '16px',
          height: '64px',
          bgcolor: 'primary.light',
          color: "white",
          right:0
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
      <Dialog
        open={!connected}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"🛌 😴 Oops! Our Couch Potato Server Hit the Snooze Button!"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
          
            Looks like our server decided to take an unscheduled nap... again! We're poking it with a virtual stick to wake it up, but you know how it is with lazy servers—they like to stretch and yawn for about 50 seconds before they're fully awake. Thanks for your patience while our server gets its act together!
            <br></br>
            <br></br>
            <LinearProgress />
          </DialogContentText>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default Chat;