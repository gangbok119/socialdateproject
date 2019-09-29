import React from 'react';
import useForm from 'react-hook-form'
import axios from 'axios';


const member = () => {
  const { register, handleSubmit, watch, errors } = useForm()
  const onSubmit = datas => { 
    console.log(datas)

    axios({
      url: 'http://localhost:8080/register',
      method: 'post',
      data: datas,
    });
   }

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <label>아이디</label><input type="tel" name="phone" placeholder="전화번호를 입력해주세요" ref={register}/><br/>
        <label>비밀번호</label><input type="password" name="password" placeholder="비밀번호를 입력해주세요" ref={register}/><br/>
        <label>비밀번호 확인</label><input type="password" name="confirm" placeholder="비밀번호를 확인해주세요" ref={register}/><br/>
        <input type="radio" name="gender" id="man" ref={register} value="0"/><label for="man">남자</label>
        <input type="radio" name="gender" id="girl" ref={register} value="1"/><label for="girl">여자</label><br/>
        <label>닉네임</label><input type="nickname" name="nickname" placeholder="닉네임 입력해주세요" ref={register}/><br/>
        <label>지역</label>
        <select name="local" ref={register}>
          <option value="seoul">서울</option>
          <option value="대전">대전</option>
          <option value="대구">대구</option>
          <option value="부산">부산</option>
        </select><br/>
        <label>생년월일</label><input type="text" name="birthday" ref={register}/><br/>
        <button type="submit">작성완료</button> 
        
      </form>
    </div>
  )
}
 
 
export default member;