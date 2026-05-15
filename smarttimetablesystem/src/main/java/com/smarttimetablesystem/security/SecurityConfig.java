package com.smarttimetablesystem.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.http.HttpMethod;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    public SecurityConfig(JwtFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(unauthorizedHandler())
                        .accessDeniedHandler(accessDeniedHandler()))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/auth/login", "/auth/register").permitAll()
                        .requestMatchers("/auth/change-password").hasAnyRole("ADMIN", "FACULTY", "STUDENT")

                        .requestMatchers(HttpMethod.GET, "/teachers/**").hasAnyRole("ADMIN", "FACULTY")
                        .requestMatchers(HttpMethod.POST, "/teachers/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/teachers/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/teachers/**").hasRole("ADMIN")

                        .requestMatchers(HttpMethod.GET, "/students/**").hasAnyRole("ADMIN", "FACULTY", "STUDENT")
                        .requestMatchers(HttpMethod.POST, "/students/**").hasAnyRole("ADMIN", "FACULTY")
                        .requestMatchers(HttpMethod.PUT, "/students/**").hasAnyRole("ADMIN", "FACULTY")
                        .requestMatchers(HttpMethod.DELETE, "/students/**").hasRole("ADMIN")

                        .requestMatchers(HttpMethod.GET, "/subjects/**").hasAnyRole("ADMIN", "FACULTY")
                        .requestMatchers(HttpMethod.POST, "/subjects/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/subjects/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/subjects/**").hasRole("ADMIN")

                        .requestMatchers(HttpMethod.GET, "/rooms/**").hasAnyRole("ADMIN", "FACULTY")
                        .requestMatchers(HttpMethod.POST, "/rooms/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/rooms/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/rooms/**").hasRole("ADMIN")

                        .requestMatchers("/timeslots/**").hasAnyRole("ADMIN", "FACULTY")
                        .requestMatchers("/schedule/**").hasAnyRole("ADMIN", "FACULTY", "STUDENT")
                        .requestMatchers("/ai/**").hasAnyRole("ADMIN", "FACULTY")
                        .requestMatchers("/messages/**").hasAnyRole("ADMIN", "FACULTY")

                        // ✅ Reviews — ADMIN + FACULTY
                        .requestMatchers("/reviews/**").hasAnyRole("ADMIN", "FACULTY")

                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable());
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("http://localhost:5173"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public AuthenticationEntryPoint unauthorizedHandler() {
        return (request, response, authException) ->
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized");
    }

    @Bean
    public AccessDeniedHandler accessDeniedHandler() {
        return (request, response, accessDeniedException) ->
                response.sendError(HttpServletResponse.SC_FORBIDDEN, "Forbidden");
    }
}