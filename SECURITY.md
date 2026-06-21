# Security Policy

## Supported NATS Versions

The following table shows which versions of NATS Server are currently supported with nats-monitoring:

| NATS Server Version | Supported | Notes |
|---------------------|-----------|-------|
| 2.10.x | ✅ Yes | Fully tested and compatible |
| 2.9.x | ✅ Yes | Compatible (JetStream features required) |
| 2.8.x | ⚠️ Partial | Basic monitoring works, some JetStream features may be limited |
| < 2.8 | ❌ No | Not supported, missing critical JetStream APIs |

**Minimum NATS Server Version:** 2.8.0  
**Recommended NATS Server Version:** 2.10.x or later

### Client Library Versions

nats-monitoring uses the following Go NATS client:
- **nats.go**: v1.52.0

This client version is tested against NATS Server 2.10.x and maintains backward compatibility with 2.8.x+.

### Go Version

- **Go**: 1.25.0

### Tested Configurations

The following NATS server configurations have been tested:

| Configuration | Status |
|----------------|--------|
| Single-node NATS with JetStream | ✅ Tested |
| NATS Cluster (3-node) with JetStream | ✅ Tested |
| TLS-enabled connections | ✅ Tested |
| Username/Password authentication | ✅ Tested |
| NKEYS authentication | ✅ Tested |
| JWT-based authentication | ✅ Tested |

## Security Features

### Built-in Security

nats-monitoring includes several security-focused features:

- **TLS/SSL Support**: Secure connections to NATS servers
- **Authentication**: Supports username/password and token-based authentication
- **NKEYS Authentication**: Native NKEYS support for enhanced security
- **User JWT**: JWT-based user authentication
- **Account-based**: Multi-tenancy with account isolation
- **Security Dashboard**: Built-in UI for monitoring security settings
- **Audit Logging**: Complete audit trail of all management actions

### Data Privacy

- **No External Dependencies**: No third-party analytics or tracking
- **Local Processing**: All data processing happens locally
- **No Cloud Services**: Does not send data to external services
- **In-memory Only**: Metrics stored in-memory, not persisted to disk

### Connection Security

By default, nats-monitoring connects to NATS using the security level of your NATS server configuration:

- Unencrypted connections if NATS allows it
- TLS encrypted if NATS requires TLS
- Respects NATS authentication requirements

**Important**: We recommend enabling TLS and authentication on your NATS server and connecting nats-monitoring using secure connection strings:

```bash
# Example with TLS
nats-monitoring --nats-url "tls://localhost:4222"

# Example with authentication
nats-monitoring --nats-url "nats://user:password@localhost:4222"

# Example with TLS and authentication
nats-monitoring --nats-url "tls://user:password@localhost:4222"
```

## Reporting a Vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Instead, report them privately via [GitHub private vulnerability reporting](https://github.com/amir/nats-monitor/security/advisories/new) or email `baghshahyamyr@gmail.com`.

Include:
- A description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested fix (optional)

### Response Timeline

| Severity | Response Time | Fix Timeline |
|----------|---------------|--------------|
| Critical | 24 hours | 48 hours |
| High | 48 hours | 7 days |
| Medium | 72 hours | 30 days |
| Low | 7 days | Next minor release |

You will receive a response within **72 hours** and a patch will be released as soon as possible.

## Security Best Practices

### For Production Deployments

1. **Enable TLS on NATS Server**
   ```nginx
   # NATS server configuration
   tls {
     cert_file: "/path/to/server.pem"
     key_file: "/path/to/key.pem"
     ca_file: "/path/to/ca.pem"
     verify: true
   }
   ```

2. **Enable Authentication**
   ```nginx
   # Username/password authentication
   authorization {
     user: admin
     password: secretpassword
     timeout: 2s
   }
   ```

3. **Use Firewall Rules**
   - Only expose necessary ports
   - Restrict access to trusted IP ranges
   - Use network policies in Kubernetes

4. **Keep Updated**
   - Regularly update nats-monitoring
   - Update NATS server
   - Monitor security advisories

5. **Resource Limits**
   ```yaml
   # Kubernetes limits example
   resources:
     limits:
       cpu: 1000m
       memory: 1Gi
     requests:
       cpu: 200m
       memory: 256Mi
   ```

### CORS Configuration

By default, CORS is set to `*` (allow all origins). For production, restrict this:

```bash
export CORS_ALLOWED_ORIGINS="https://your-domain.com,https://app.your-domain.com"
```

### Environment Variables

Never commit credentials to version control. Use environment variables or secret management:

```bash
# .env file (DO NOT COMMIT)
NATS_URL=tls://nats.production.example.com:4222
NATS_USER=admin
NATS_PASSWORD=secure-password
```

## Vulnerability Scanning

This project uses automated security scanning:

- **Dependabot**: Automated dependency updates
- **GitHub Actions**: Security scanning on PRs
- **Go Vulnerability Database**: Checked during builds

## Dependencies

Security updates for dependencies are handled through:

- Automatic dependabot pull requests
- Regular security audits
- Prompt updates for critical vulnerabilities

## License

This project is licensed under the Apache 2.0 License. See [LICENSE](LICENSE) for details.

## Additional Resources

- [NATS Security Documentation](https://docs.nats.io/nats-concepts/securing_nats)
- [NATS Server Configuration](https://docs.nats.io/running-a-nats-service/configuration)
- [Go Security Best Practices](https://golang.org/doc/security)
