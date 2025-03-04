// VPC
resource "aws_vpc" "this" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = local.name
  }
}

// Internet Gateway
resource "aws_internet_gateway" "this" {
  vpc_id = aws_vpc.this.id

  tags = {
    Name = "${local.name}-igw"
  }
}

// Public Subnets
resource "aws_subnet" "public" {
  count                   = length(local.azs)
  vpc_id                  = aws_vpc.this.id
  cidr_block              = "10.0.${count.index + 101}.0/24"
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${local.name}-public-${local.azs[count.index]}"
  }
}

// Private Subnets
resource "aws_subnet" "private" {
  count             = length(local.azs)
  vpc_id            = aws_vpc.this.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = local.azs[count.index]

  tags = {
    Name = "${local.name}-private-${local.azs[count.index]}"
  }
}

// Database Subnets
resource "aws_subnet" "database" {
  count             = 2
  vpc_id            = aws_vpc.this.id
  cidr_block        = "10.0.${count.index + 21}.0/24"
  availability_zone = local.azs[count.index]

  tags = {
    Name = "${local.name}-database-${local.azs[count.index]}"
  }
}

// Database Subnet Group
resource "aws_db_subnet_group" "this" {
  name       = "${local.name}-db-subnet-group"
  subnet_ids = aws_subnet.database[*].id

  tags = {
    Name = "${local.name}-db-subnet-group"
  }
}

// NAT Gateway Elastic IP
resource "aws_eip" "nat" {
  count  = local.prod ? length(local.azs) : 1
  domain = "vpc"

  tags = {
    Name = "${local.name}-nat-eip-${count.index}"
  }
}

// NAT Gateway
resource "aws_nat_gateway" "this" {
  count         = local.prod ? length(local.azs) : 1
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "${local.name}-nat-${count.index}"
  }

  depends_on = [aws_internet_gateway.this]
}

// Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.this.id

  tags = {
    Name = "${local.name}-public-rt"
  }
}

// Public Route
resource "aws_route" "public_internet_gateway" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.this.id
}

// Public Route Table Associations
resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

// Private Route Tables
resource "aws_route_table" "private" {
  count  = local.prod ? length(local.azs) : 1
  vpc_id = aws_vpc.this.id

  tags = {
    Name = "${local.name}-private-rt-${count.index}"
  }
}

// Private Routes
resource "aws_route" "private_nat_gateway" {
  count                  = local.prod ? length(local.azs) : 1
  route_table_id         = aws_route_table.private[count.index].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.this[count.index].id
}

// Private Route Table Associations
resource "aws_route_table_association" "private" {
  count          = length(aws_subnet.private)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = local.prod ? aws_route_table.private[count.index].id : aws_route_table.private[0].id
}

// Database Route Table
resource "aws_route_table" "database" {
  vpc_id = aws_vpc.this.id

  tags = {
    Name = "${local.name}-database-rt"
  }
}

// Database Internet Route
resource "aws_route" "database_internet_gateway" {
  route_table_id         = aws_route_table.database.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.this.id
}

// Database Route Table Associations
resource "aws_route_table_association" "database" {
  count          = length(aws_subnet.database)
  subnet_id      = aws_subnet.database[count.index].id
  route_table_id = aws_route_table.database.id
}
