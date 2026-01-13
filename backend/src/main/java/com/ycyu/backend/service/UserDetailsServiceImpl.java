package com.ycyu.backend.service;

import com.ycyu.backend.entity.User;
import com.ycyu.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // 根据用户名查找用户
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("用户不存在: " + username));
        
        // 构建用户权限列表
        List<GrantedAuthority> authorities = new ArrayList<>();
        // 添加角色权限，需要前缀ROLE_
        authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole()));
        
        // 返回UserDetails对象，使用明文密码
        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(),  // 数据库中的明文密码
                user.isEnabled(),
                true, // 账户未过期
                true, // 凭证未过期
                true, // 账户未锁定
                authorities
        );
    }
}