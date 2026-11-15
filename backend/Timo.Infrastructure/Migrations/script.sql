IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
CREATE TABLE [Users] (
    [Id] uniqueidentifier NOT NULL,
    [UserName] nvarchar(256) NULL,
    [NormalizedUserName] nvarchar(256) NULL,
    [Email] nvarchar(256) NULL,
    [NormalizedEmail] nvarchar(256) NULL,
    [EmailConfirmed] bit NOT NULL,
    [PasswordHash] nvarchar(max) NULL,
    [SecurityStamp] nvarchar(max) NULL,
    [ConcurrencyStamp] nvarchar(max) NULL,
    [PhoneNumber] nvarchar(max) NULL,
    [PhoneNumberConfirmed] bit NOT NULL,
    [TwoFactorEnabled] bit NOT NULL,
    [LockoutEnd] datetimeoffset NULL,
    [LockoutEnabled] bit NOT NULL,
    [AccessFailedCount] int NOT NULL,
    CONSTRAINT [PK_Users] PRIMARY KEY ([Id])
);

CREATE TABLE [AspNetUserClaims] (
    [Id] int NOT NULL IDENTITY,
    [UserId] uniqueidentifier NOT NULL,
    [ClaimType] nvarchar(max) NULL,
    [ClaimValue] nvarchar(max) NULL,
    CONSTRAINT [PK_AspNetUserClaims] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_AspNetUserClaims_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [AspNetUserLogins] (
    [LoginProvider] nvarchar(128) NOT NULL,
    [ProviderKey] nvarchar(128) NOT NULL,
    [ProviderDisplayName] nvarchar(max) NULL,
    [UserId] uniqueidentifier NOT NULL,
    CONSTRAINT [PK_AspNetUserLogins] PRIMARY KEY ([LoginProvider], [ProviderKey]),
    CONSTRAINT [FK_AspNetUserLogins_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [AspNetUserTokens] (
    [UserId] uniqueidentifier NOT NULL,
    [LoginProvider] nvarchar(128) NOT NULL,
    [Name] nvarchar(128) NOT NULL,
    [Value] nvarchar(max) NULL,
    CONSTRAINT [PK_AspNetUserTokens] PRIMARY KEY ([UserId], [LoginProvider], [Name]),
    CONSTRAINT [FK_AspNetUserTokens_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [Projects] (
    [Id] uniqueidentifier NOT NULL,
    [Name] nvarchar(100) NOT NULL,
    [UserId] uniqueidentifier NOT NULL,
    CONSTRAINT [PK_Projects] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Projects_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [TimeEntries] (
    [Id] uniqueidentifier NOT NULL,
    [Date] date NOT NULL,
    [Duration] time NOT NULL,
    [Description] nvarchar(500) NULL,
    [ProjectId] uniqueidentifier NOT NULL,
    [UserId] uniqueidentifier NOT NULL,
    CONSTRAINT [PK_TimeEntries] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_TimeEntries_Projects_ProjectId] FOREIGN KEY ([ProjectId]) REFERENCES [Projects] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_TimeEntries_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id])
);

CREATE INDEX [IX_AspNetUserClaims_UserId] ON [AspNetUserClaims] ([UserId]);

CREATE INDEX [IX_AspNetUserLogins_UserId] ON [AspNetUserLogins] ([UserId]);

CREATE INDEX [IX_Projects_UserId] ON [Projects] ([UserId]);

CREATE INDEX [IX_TimeEntries_ProjectId] ON [TimeEntries] ([ProjectId]);

CREATE INDEX [IX_TimeEntries_UserId] ON [TimeEntries] ([UserId]);

CREATE INDEX [EmailIndex] ON [Users] ([NormalizedEmail]);

CREATE UNIQUE INDEX [UserNameIndex] ON [Users] ([NormalizedUserName]) WHERE [NormalizedUserName] IS NOT NULL;

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20261027185050_InitialCreate', N'10.0.14');

COMMIT;
GO

BEGIN TRANSACTION;
ALTER TABLE [Projects] ADD [CreatedAtUtc] datetime2 NOT NULL DEFAULT (SYSUTCDATETIME());

ALTER TABLE [Projects] ADD [Description] nvarchar(500) NULL;

CREATE TABLE [RefreshTokens] (
    [Id] uniqueidentifier NOT NULL,
    [TokenHash] nvarchar(64) NOT NULL,
    [UserId] uniqueidentifier NOT NULL,
    [CreatedAtUtc] datetime2 NOT NULL,
    [ExpiresAtUtc] datetime2 NOT NULL,
    [RevokedAtUtc] datetime2 NULL,
    CONSTRAINT [PK_RefreshTokens] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_RefreshTokens_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
);

CREATE UNIQUE INDEX [IX_RefreshTokens_TokenHash] ON [RefreshTokens] ([TokenHash]);

CREATE INDEX [IX_RefreshTokens_UserId] ON [RefreshTokens] ([UserId]);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20261106134113_AddProjectDetailsAndRefreshTokens', N'10.0.14');

COMMIT;
GO

BEGIN TRANSACTION;
DROP INDEX [IX_TimeEntries_UserId] ON [TimeEntries];

CREATE INDEX [IX_TimeEntries_UserId_Date_ProjectId] ON [TimeEntries] ([UserId], [Date], [ProjectId]);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20261113221358_AddTimeEntryUserDateProjectIndex', N'10.0.14');

COMMIT;
GO

BEGIN TRANSACTION;
DROP INDEX [EmailIndex] ON [Users];

DROP INDEX [IX_Projects_UserId] ON [Projects];

CREATE UNIQUE INDEX [EmailIndex] ON [Users] ([NormalizedEmail]) WHERE [NormalizedEmail] IS NOT NULL;

ALTER TABLE [TimeEntries] ADD CONSTRAINT [CK_TimeEntries_Duration] CHECK ([Duration] > '00:00:00');

CREATE UNIQUE INDEX [IX_Projects_UserId_Name] ON [Projects] ([UserId], [Name]);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20261115213119_AddUserProjectAndTimeEntryConstraints', N'10.0.14');

COMMIT;
GO

