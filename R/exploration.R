library(ggplot2)
library(jsonlite)
library(ggvis)

data <- fromJSON("../data/observations.json")

data <- data.frame(year=data$year,
                   yearName=data$yearName,
                   game=data$game);

squishYears <- function(years){
    signs <- sign(years)
    absYears <- log10(abs(years))
    absYears*signs    
};

chopYears <- function(df){
    df <- df[df$year>-13000 & df$year < 41000,]
    df
}

simpleTimeLine <- function(df){
    df$year <- squishYears(as.numeric(df$year));
    df$y <- runif(length(data$year),
                           0,
                           100)
    graphics.off()
    (ggplot(df,aes(x=year,y=0))
        +geom_segment(aes(y=0,yend=y,xend=year))
        +geom_text(aes(y=y,label=game),size=2.5,vjust=-1))    
}

histo <- function(df){
    df <- chopYears(df);
    graphics.off();
    (ggplot(df,aes(year))
        +geom_histogram(binwidth=25))
}

distortYears <- function(df,minD,maxD){
    yd <- log10(diff(as.numeric(df$year)));
    yd <- cumsum(c(0,yd));
    yd <- 1/log10(1/diff(yd))
    df$distorted <- cumsum(c(0,yd));
    df
}

simpleTimeLineVis <- function(df){   
    df$y <- seq(length(data$year));
    df <- distortYears(df);
    (df %>%
        ggvis(x=~distorted, y=~y, text:=~game) %>%
        layer_text() %>%
        set_options(height = 10480, width = 10480))
}
simpleTimeLineVis(data)



