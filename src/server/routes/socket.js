// 소켓 라우터 구현
// 당장만나 기능/ 귓속말 기능
// 당장만나 - 위치정보를 기반으로 하여 가까운 사람끼리 채팅방 생성
// 귓속말 - 팔로우 누른 사람에게 귓속말을 보낼 수 있는 기능(채팅방 생성) - 유료



// 방, 사용자, 채팅, 세 가지 스키마 필요


// 

//app.set('io',io);
//1. 당장만나로 저절로 생성되는 채팅방 해당 네임스페이스
// 
// 수락 시 채팅방 유지
// 거절 시 채팅방 없앰
// 2. 아이디를 db에서 가져와서 해당 유저의 아이디로 만드는 로직
// 3. msg는 간단하게 몽고db 등으로 처리
// 4. 수락/거절 버튼
// socket.emit('connect')

// socket.emit('msg')

//2. 귓속말로 생성되는 채팅방 해당 네임스페이스
// router.get('/:id',(req,res) =>{
//  const 귓말 = io.of('/'+req.params.id);
//  귓말.on('connection',(socket) =>{

//})
//}) 

// 귓속말을 받는 사람이 채팅방을 나가면 없앰 
// 귓속말 받는 사람의 id나 닉네임으로 네임스페이스를 만들면 편할 듯.

